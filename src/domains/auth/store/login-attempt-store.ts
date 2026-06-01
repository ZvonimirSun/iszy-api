import type { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import ms from 'ms'
import { Fail2banConfig, Logger } from '~shared'

interface LoginAttemptState {
  count: number
  firstFailedAt: number
}

interface LoginAttemptInfo {
  code: 'LOGIN_FAILED'
  failedCount: number
  remainingAttempts: number
  maxAttempts: number
  windowSeconds: number
}

interface LoginBanInfo {
  code: 'LOGIN_BANNED'
  retryAfterSeconds: number
  bannedUntil: string
}

type LoginAttemptScope = 'account' | 'ip'
type LoginAttemptRecord = LoginAttemptInfo & { dimension: LoginAttemptDimension }

interface LoginAttemptDimension {
  scope: LoginAttemptScope
  attemptKey: string
  banKey: string
}

@Injectable()
export class LoginAttemptStore {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    const config = this.configService.get<Fail2banConfig>('auth.fail2ban')
    this.maxAttempts = config.maxAttempts
    this.windowMs = ms(config.window)
    this.banMs = ms(config.banTime)
  }

  private readonly logger = new Logger(LoginAttemptStore.name)
  private readonly maxAttempts: number
  private readonly windowMs: number
  private readonly banMs: number

  async assertAllowed(userName: string, ip: string) {
    for (const dimension of this.getDimensions(userName, ip)) {
      const bannedUntil = await this.cacheManager.get<number>(dimension.banKey)
      if (!bannedUntil)
        continue

      const remainingMs = bannedUntil - Date.now()
      if (remainingMs <= 0) {
        await this.cacheManager.del(dimension.banKey)
        continue
      }

      throw this.createBannedException(remainingMs, bannedUntil)
    }
  }

  async recordFailure(userName: string, ip: string): Promise<LoginAttemptInfo> {
    const dimensions = this.getDimensions(userName, ip)
    const attemptInfos = await Promise.all(
      dimensions.map(dimension => this.recordDimensionFailure(userName, ip, dimension)),
    )

    const bannedAttemptInfos = attemptInfos.filter(info => info.failedCount >= this.maxAttempts)
    if (bannedAttemptInfos.length) {
      const bannedUntil = Date.now() + this.banMs
      for (const attemptInfo of bannedAttemptInfos) {
        const dimension = attemptInfo.dimension
        await this.cacheManager.del(dimension.attemptKey)
        await this.cacheManager.set(dimension.banKey, bannedUntil, this.banMs)
        this.logger.warn('登录失败次数过多，已临时封禁', {
          userName,
          ip,
          scope: dimension.scope,
          maxAttempts: this.maxAttempts,
          banMinutes: Math.ceil(this.banMs / 60000),
        })
      }
      throw this.createBannedException(this.banMs, bannedUntil)
    }

    return this.toAttemptInfo(attemptInfos[0])
  }

  async reset(userName: string) {
    await this.cacheManager.del(this.getAccountDimension(userName).attemptKey)
  }

  private async recordDimensionFailure(
    userName: string,
    ip: string,
    dimension: LoginAttemptDimension,
  ): Promise<LoginAttemptRecord> {
    const now = Date.now()
    const state = await this.cacheManager.get<LoginAttemptState>(dimension.attemptKey)
    const nextState: LoginAttemptState = state && now - state.firstFailedAt < this.windowMs
      ? {
          count: state.count + 1,
          firstFailedAt: state.firstFailedAt,
        }
      : {
          count: 1,
          firstFailedAt: now,
        }

    await this.cacheManager.set(dimension.attemptKey, nextState, this.windowMs)
    this.logger.debug('登录失败已记录', {
      userName,
      ip,
      scope: dimension.scope,
      failedCount: nextState.count,
      maxAttempts: this.maxAttempts,
    })
    return {
      code: 'LOGIN_FAILED',
      dimension,
      failedCount: nextState.count,
      remainingAttempts: this.maxAttempts - nextState.count,
      maxAttempts: this.maxAttempts,
      windowSeconds: Math.ceil(this.windowMs / 1000),
    }
  }

  private getDimensions(userName: string, ip: string): LoginAttemptDimension[] {
    return [
      this.getAccountDimension(userName),
      {
        scope: 'ip',
        attemptKey: `fail2ban:login:attempt:ip:${ip}`,
        banKey: `fail2ban:login:ban:ip:${ip}`,
      },
    ]
  }

  private getAccountDimension(userName: string): LoginAttemptDimension {
    return {
      scope: 'account',
      attemptKey: `fail2ban:login:attempt:account:${userName}`,
      banKey: `fail2ban:login:ban:account:${userName}`,
    }
  }

  private toAttemptInfo(record: LoginAttemptRecord): LoginAttemptInfo {
    return {
      code: record.code,
      failedCount: record.failedCount,
      remainingAttempts: record.remainingAttempts,
      maxAttempts: record.maxAttempts,
      windowSeconds: record.windowSeconds,
    }
  }

  private createBannedException(remainingMs: number, bannedUntil: number) {
    const data: LoginBanInfo = {
      code: 'LOGIN_BANNED',
      retryAfterSeconds: Math.ceil(remainingMs / 1000),
      bannedUntil: new Date(bannedUntil).toISOString(),
    }
    return new UnauthorizedException({
      message: `登录失败次数过多，请 ${Math.ceil(remainingMs / 60000)} 分钟后再试`,
      data,
    })
  }
}

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
    const bannedUntil = await this.cacheManager.get<number>(this.getBanKey(userName, ip))
    if (!bannedUntil)
      return

    const remainingMs = bannedUntil - Date.now()
    if (remainingMs <= 0) {
      await this.cacheManager.del(this.getBanKey(userName, ip))
      return
    }

    throw this.createBannedException(remainingMs, bannedUntil)
  }

  async recordFailure(userName: string, ip: string): Promise<LoginAttemptInfo> {
    const key = this.getAttemptKey(userName, ip)
    const now = Date.now()
    const state = await this.cacheManager.get<LoginAttemptState>(key)
    const nextState: LoginAttemptState = state && now - state.firstFailedAt < this.windowMs
      ? {
          count: state.count + 1,
          firstFailedAt: state.firstFailedAt,
        }
      : {
          count: 1,
          firstFailedAt: now,
        }

    if (nextState.count >= this.maxAttempts) {
      await this.cacheManager.del(key)
      const bannedUntil = now + this.banMs
      await this.cacheManager.set(this.getBanKey(userName, ip), bannedUntil, this.banMs)
      this.logger.warn('登录失败次数过多，已临时封禁', {
        userName,
        ip,
        maxAttempts: this.maxAttempts,
        banMinutes: Math.ceil(this.banMs / 60000),
      })
      throw this.createBannedException(this.banMs, bannedUntil)
    }

    await this.cacheManager.set(key, nextState, this.windowMs)
    this.logger.debug('登录失败已记录', {
      userName,
      ip,
      failedCount: nextState.count,
      maxAttempts: this.maxAttempts,
    })
    return {
      code: 'LOGIN_FAILED',
      failedCount: nextState.count,
      remainingAttempts: this.maxAttempts - nextState.count,
      maxAttempts: this.maxAttempts,
      windowSeconds: Math.ceil(this.windowMs / 1000),
    }
  }

  async reset(userName: string, ip: string) {
    await this.cacheManager.del(this.getAttemptKey(userName, ip))
    await this.cacheManager.del(this.getBanKey(userName, ip))
  }

  private getAttemptKey(userName: string, ip: string) {
    // 按用户名和 IP 组合计数，避免单一来源的失败尝试影响用户在其他网络登录。
    return `fail2ban:login:attempt:${userName}:${ip}`
  }

  private getBanKey(userName: string, ip: string) {
    return `fail2ban:login:ban:${userName}:${ip}`
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

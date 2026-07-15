import type { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { GoneException, Inject, Injectable } from '@nestjs/common'
import ms from 'ms'
import { random, SsoCompletionData } from '~shared'

@Injectable()
export class SsoCompletionStore {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private readonly ttl = ms('10m')
  private readonly queues = new Map<string, Promise<void>>()
  private readonly tokenPattern = /^[0-9A-Za-z]{32}$/

  async create(data: Omit<SsoCompletionData, 'createdAt'>) {
    // This token is a short-lived bearer credential, so it needs substantially
    // more entropy than the legacy eight-character OAuth ticket.
    const token = random(32)
    await this.cacheManager.set(this.getKey(token), {
      ...data,
      createdAt: Date.now(),
    }, this.ttl)
    return token
  }

  async get(token: string) {
    if (!this.tokenPattern.test(token)) {
      return null
    }
    return await this.cacheManager.get<SsoCompletionData>(this.getKey(token)) || null
  }

  async getOrThrow(token: string) {
    const data = await this.get(token)
    if (!data) {
      throw new GoneException('SSO 登录流程无效或已过期')
    }
    return data
  }

  async remove(token: string) {
    await this.cacheManager.del(this.getKey(token))
  }

  async consume<T>(token: string, handler: (data: SsoCompletionData) => Promise<T>) {
    return this.runExclusive(token, async () => {
      const data = await this.getOrThrow(token)
      const result = await handler(data)
      await this.remove(token)
      return result
    })
  }

  private async runExclusive<T>(token: string, handler: () => Promise<T>) {
    const previous = this.queues.get(token) || Promise.resolve()
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const queued = previous.then(() => gate)
    this.queues.set(token, queued)

    await previous
    try {
      return await handler()
    }
    finally {
      release()
      if (this.queues.get(token) === queued) {
        this.queues.delete(token)
      }
    }
  }

  private getKey(token: string) {
    return `oauth:sso:completion:${token}`
  }
}

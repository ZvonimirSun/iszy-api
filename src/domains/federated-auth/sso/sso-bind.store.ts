import type { Cache } from 'cache-manager'
import type { SsoBindData } from '~shared'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import ms from 'ms'
import { random } from '~shared'

@Injectable()
export class SsoBindStore {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(data: SsoBindData) {
    const token = random()
    await this.cacheManager.set(`sso:bind:${token}`, data, ms('5m'))
    return token
  }

  async get(token: string): Promise<SsoBindData | null> {
    return await this.cacheManager.get<SsoBindData>(`sso:bind:${token}`) ?? null
  }

  async remove(token: string) {
    await this.cacheManager.del(`sso:bind:${token}`)
  }
}

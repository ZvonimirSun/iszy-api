import type { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import ms from 'ms'
import { StateData } from '~types/oauth'

@Injectable()
export class OauthStore {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async setState(state: string, data: StateData) {
    await this.cacheManager.set(`oauth:state:${state}`, data, ms('5m'))
  }

  async getState(state: string) {
    return this.cacheManager.get<StateData | undefined>(`oauth:state:${state}`)
  }

  async removeState(state: string) {
    await this.cacheManager.del(`oauth:state:${state}`)
  }
}

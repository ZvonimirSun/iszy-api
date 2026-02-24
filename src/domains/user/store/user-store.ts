import type { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { OptionalExcept, RawUser } from '@zvonimirsun/iszy-common'

@Injectable()
export class UserStore {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async setUser(user: RawUser) {
    await this.cacheManager.set(`user:userId:${user.userId}`, user, 60 * 60 * 1000)
    await this.cacheManager.set(`user:userName:${user.userName}:userId`, user.userId, 60 * 60 * 1000)
  }

  async getUser(userIdOrName: string | number): Promise<RawUser | null> {
    if (typeof userIdOrName === 'number') {
      const cacheKey = `user:userId:${userIdOrName}`
      return this.cacheManager.get<RawUser>(cacheKey)
    }
    else {
      const userIdKey = `user:userName:${userIdOrName}:userId`
      const cachedUserId = await this.cacheManager.get<number>(userIdKey)
      if (!cachedUserId) {
        return null
      }
      const cacheKey = `user:userId:${cachedUserId}`
      return this.cacheManager.get<RawUser>(cacheKey)
    }
  }

  async removeUser(user: OptionalExcept<RawUser, 'userId' | 'userName'>): Promise<void> {
    await this.cacheManager.del(`user:userId:${user.userId}`)
    await this.cacheManager.del(`user:userName:${user.userName}:userId`)
  }
}

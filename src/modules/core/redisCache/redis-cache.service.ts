import type { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class RedisCacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    return this.cacheManager.get(key)
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<T> {
    return this.cacheManager.set(key, value, ttl)
  }

  async del(key: string): Promise<boolean> {
    return this.cacheManager.del(key)
  }
}

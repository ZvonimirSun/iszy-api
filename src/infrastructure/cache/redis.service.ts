import type { CacheModuleOptions } from '@nestjs/cache-manager'
import type { Cache } from 'cache-manager'
import type { RedisOptions } from 'ioredis'
import KeyvRedis from '@keyv/redis'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { KeyvStoreAdapter } from 'keyv'

@Injectable()
export class RedisService {
  private cacheStore: KeyvStoreAdapter
  private readonly logger = new Logger(RedisService.name)

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  getConfig(): CacheModuleOptions<RedisOptions> {
    if (!this.cacheStore) {
      try {
        this.cacheStore = new KeyvRedis({
          url: `redis://${this.configService.get<string>('redis.host')}:${this.configService.get<number>('redis.port')}`,
          password: this.configService.get<string>('redis.password'),
        })
        this.logger.log(
          `缓存连接 Redis {redis://.:***@${this.configService.get<string>(
            'redis.host',
          )}:${this.configService.get<number>('redis.port')}} 成功`,
        )
      }
      catch (e) {
        this.logger.error(`连接 Redis 失败，${e.message}`)
        throw e
      }
    }
    return {
      stores: [
        this.cacheStore,
      ],
    }
  }
}

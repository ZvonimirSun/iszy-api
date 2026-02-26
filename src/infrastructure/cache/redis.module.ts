import type { CacheModuleOptions } from '@nestjs/cache-manager'
import type { RedisOptions } from 'ioredis'
import KeyvRedis from '@keyv/redis'
import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Logger } from '~shared'

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService): CacheModuleOptions<RedisOptions> => {
        const logger = new Logger('RedisModule')

        try {
          const cacheStore = new KeyvRedis({
            url: `redis://${configService.get<string>('redis.host')}:${configService.get<number>('redis.port')}`,
            password: configService.get<string>('redis.password'),
          })
          logger.log(
            `缓存连接 Redis {redis://.:***@${configService.get<string>(
              'redis.host',
            )}:${configService.get<number>('redis.port')}} 成功`,
          )
          return {
            stores: [
              cacheStore,
            ],
          }
        }
        catch (e) {
          logger.error(`连接 Redis 失败，${e.message}`)
          throw e
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class RedisModule {}

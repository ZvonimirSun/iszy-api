import type { CacheModuleOptions } from '@nestjs/cache-manager'
import KeyvRedis from '@keyv/redis'
import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Logger, RedisConfig } from '~shared'

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService): CacheModuleOptions => {
        const logger = new Logger('RedisModule')
        const redisConfig = configService.get<RedisConfig>('redis')

        try {
          const cacheStore = new KeyvRedis({
            url: `redis://${redisConfig.host}:${redisConfig.port}`,
            password: redisConfig.password,
          })
          logger.log(
            `缓存连接 Redis {redis://.:***@${redisConfig.host}:${redisConfig.port}} 成功`,
          )
          return {
            stores: cacheStore,
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

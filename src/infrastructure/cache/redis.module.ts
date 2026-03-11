import type { CacheModuleOptions } from '@nestjs/cache-manager'
import KeyvRedis from '@keyv/redis'
import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RedisConfig } from '~shared'

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService): CacheModuleOptions => {
        const redisConfig = configService.get<RedisConfig>('redis')

        const cacheStore = new KeyvRedis({
          url: `redis://${redisConfig.host}:${redisConfig.port}`,
          password: redisConfig.password,
        })
        return {
          stores: cacheStore,
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class RedisModule {}

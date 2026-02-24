import type { CacheModuleOptions } from '@nestjs/cache-manager'
import type { RedisOptions } from 'ioredis'
import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { RedisService } from './redis.service'

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (redisService: RedisService): CacheModuleOptions<RedisOptions> => (redisService.getConfig()),
      inject: [RedisService],
    }),
  ],
  providers: [RedisService],
})
export class RedisModule {}

import type { CacheModuleOptions } from '@nestjs/cache-manager'
import type { RedisOptions } from 'ioredis'
import { CacheModule } from '@nestjs/cache-manager'
import { Global, Module } from '@nestjs/common'
import { ConnectionModule } from '~modules/core/connection/connection.module'
import { ConnectionService } from '~modules/core/connection/connection.service'
import { RedisCacheService } from '~modules/core/redisCache/redis-cache.service'

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (connectionService: ConnectionService): CacheModuleOptions<RedisOptions> => (connectionService.getCacheConfig()),
      inject: [ConnectionService],
    }),
    ConnectionModule,
  ],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class RedisCacheModule {}

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import configs from '~/configs'
import { RedisModule } from './cache/redis.module'
import { DatabaseModule } from './database/database.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configs],
      cache: true,
    }),
    RedisModule,
    DatabaseModule,
  ],
})
export class InfrastructureModule {}

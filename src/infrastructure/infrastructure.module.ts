import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { RedisModule } from './cache/redis.module'
import configs from './configs'
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

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { RedisModule } from './cache/redis.module'
import configLoader from './config/configLoader'
import { DatabaseModule } from './database/database.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [configLoader],
      cache: true,
    }),
    RedisModule,
    DatabaseModule,
  ],
})
export class InfrastructureModule {}

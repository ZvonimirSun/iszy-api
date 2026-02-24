import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import configs from '~/configs'
import { RedisModule } from './cache/redis.module'
import { DatabaseModule } from './database/database.module'
import { SessionModule } from './session/session.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configs],
      cache: true,
    }),
    RedisModule,
    DatabaseModule,
    SessionModule,
  ],
})
export class InfrastructureModule {}

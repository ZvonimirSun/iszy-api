import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import configs from '~/configs'
import { RedisService } from './cache/redis.service'
import { DatabaseModule } from './database/database.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configs],
      cache: true,
    }),
    RedisService,
    DatabaseModule,
  ],
})
export class InfrastructureModule {}

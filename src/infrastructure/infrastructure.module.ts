import { Module } from '@nestjs/common'
import { RedisModule } from './cache/redis.module'
import { ConfigLoadModule } from './config/config-load.module'
import { DatabaseModule } from './database/database.module'

@Module({
  imports: [
    ConfigLoadModule,
    RedisModule,
    DatabaseModule,
  ],
})
export class InfrastructureModule {}

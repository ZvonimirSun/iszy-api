import { Module } from '@nestjs/common'
import { RedisService } from './cache/redis.service'
import { DatabaseModule } from './database/database.module'

@Module({
  imports: [
    RedisService,
    DatabaseModule,
  ],
})
export class InfrastructureModule {}

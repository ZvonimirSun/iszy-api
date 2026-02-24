import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RedisStore } from 'connect-redis'
import Redis from 'ioredis'

@Injectable()
export class SessionService {
  constructor(private readonly configService: ConfigService) {}

  private sessionStore: RedisStore

  private readonly logger = new Logger(SessionService.name)

  getStore(): RedisStore {
    if (!this.sessionStore) {
      try {
        const redisClient = new Redis(
          this.configService.get<number>('redis.port'),
          this.configService.get<string>('redis.host'),
          {
            password: this.configService.get<string>('redis.password'),
          },
        )
        this.sessionStore = new RedisStore({
          client: redisClient,
        })
        this.logger.log(
          `Session连接 Redis {redis://.:***@${this.configService.get<string>(
            'redis.host',
          )}:${this.configService.get<number>('redis.port')}} 成功`,
        )
      }
      catch (e) {
        this.logger.error(`连接 Redis 失败，${e.message}`)
        throw e
      }
    }
    return this.sessionStore
  }
}

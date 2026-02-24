import type { SessionOptions } from 'express-session'
import { Logger, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RedisStore } from 'connect-redis'
import Redis from 'ioredis'
import { merge } from 'lodash'
import ms from 'ms'

@Module({
  providers: [
    {
      provide: 'SESSION_CONFIG',
      useFactory: (configService: ConfigService): SessionOptions => {
        const logger = new Logger('SessionModule')

        try {
          const redisClient = new Redis(
            configService.get<number>('redis.port'),
            configService.get<string>('redis.host'),
            {
              password: configService.get<string>('redis.password'),
            },
          )
          const sessionStore = new RedisStore({
            client: redisClient,
          })
          logger.log(
            `Session连接 Redis {redis://.:***@${configService.get<string>(
              'redis.host',
            )}:${configService.get<number>('redis.port')}} 成功`,
          )

          const sessionConfig: SessionOptions = {
            cookie: {
              httpOnly: true,
              maxAge: ms('30m'),
            },
            name: 'iszy_api.connect.sid',
            resave: false,
            rolling: true,
            saveUninitialized: false,
            secret: configService.get<string>('auth.jwt.secret'),
            // 使用redis存储session
            store: sessionStore,
          }

          if (!configService.get<boolean>('development')) {
            sessionConfig.cookie = merge({}, sessionConfig.cookie, {
              secure: true,
            })
          }

          return sessionConfig
        }
        catch (e) {
          logger.error(`连接 Redis 失败，${e.message}`)
          throw e
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: ['SESSION_CONFIG'],
})
export class SessionModule {}

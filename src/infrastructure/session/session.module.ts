import type { SessionOptions } from 'express-session'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { merge } from 'lodash'
import ms from 'ms'
import { SessionService } from './session.service'

@Module({
  imports: [
    SessionService,
  ],
  providers: [
    SessionService,
    {
      provide: 'SESSION_CONFIG',
      useFactory: (sessionService: SessionService, configService: ConfigService): SessionOptions => {
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
          store: sessionService.getStore(),
        }

        if (!configService.get<boolean>('development')) {
          sessionConfig.cookie = merge({}, sessionConfig.cookie, {
            secure: true,
          })
        }

        return sessionConfig
      },
      inject: [SessionService, ConfigService],
    },
  ],
  exports: ['SESSION_CONFIG'],
})
export class SessionModule {}

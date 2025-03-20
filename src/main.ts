import type { NestExpressApplication } from '@nestjs/platform-express'
import type { SessionOptions } from 'express-session'
import * as process from 'node:process'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { json, urlencoded } from 'body-parser'
import cookieParser from 'cookie-parser'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import session from 'express-session'
import { merge } from 'lodash'
import passport from 'passport'
import { HttpExceptionFilter } from '~core/filter/http-exception.filter'
import { ConnectionService } from '~modules/connection/connection.service'
import info from '../package.json'
import { AppModule } from './app.module'
import getLogLevels from './core/getLogLevels'
import SwaggerPublic from './swagger.public'
import 'dayjs/locale/zh-cn'

// 设置passport序列化和反序列化user的方法，在将用户信息存储到session时使用
passport.serializeUser((user, done) => {
  done(null, user)
})
// 反序列化
passport.deserializeUser((user, done) => {
  done(null, user)
})

async function bootstrap() {
  dayjs.locale('zh-cn')
  dayjs.extend(utc)
  dayjs.extend(timezone)
  dayjs.extend(customParseFormat)
  dayjs.tz.setDefault('Asia/Shanghai')

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: getLogLevels(process.env.DEVELOPMENT === 'true'),
  })

  const configService: ConfigService = app.get(ConfigService)
  const connectionService: ConnectionService = app.get(ConnectionService)

  const bodyLimit = configService.get<string>('app.bodyLimit')
  app.use(json({ limit: bodyLimit }))
  app.use(urlencoded({ limit: bodyLimit, extended: true }))
  app.use(cookieParser())
  app.set('query parser', 'extended')
  app.disable('x-powered-by')
  app.enableCors({
    origin(requestOrigin, callback) {
      const origins = configService.get<string[]>('app.allowOrigins')
      if (origins != null) {
        if (requestOrigin.includes(requestOrigin))
          callback(null, requestOrigin)
        else
          callback(new Error(`Not allow origin ${requestOrigin}`))
      }
      else {
        callback(null, requestOrigin)
      }
    },
    credentials: true,
  })
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  const behindProxy = configService.get<boolean>('behindProxy')
  const trustProxy = configService.get<string>('trustProxy')
  if (behindProxy || trustProxy) {
    if (trustProxy) {
      const defaultTrustProxy = 'loopback, linklocal, uniquelocal, '
      app.set('trust proxy', defaultTrustProxy + trustProxy)
    }
    else {
      app.set('trust proxy', true)
    }
  }

  const sessionConfig: SessionOptions = {
    cookie: {
      httpOnly: true,
    },
    name: 'iszy_api.connect.sid',
    resave: false,
    rolling: true,
    saveUninitialized: false,
    secret: configService.get<string>('session.secret'),
    // 使用redis存储session
    store: connectionService.getSessionStore(),
  }

  if (configService.get<string>('session.domain')) {
    sessionConfig.cookie = merge({}, sessionConfig.cookie, {
      domain: configService.get<string>('session.domain'),
    })
  }

  if (!configService.get<boolean>('development')) {
    sessionConfig.cookie = merge({}, sessionConfig.cookie, {
      sameSite: true,
      secure: true,
    })
  }

  if (configService.get<number>('session.maxAge') != null) {
    sessionConfig.cookie = merge({}, sessionConfig.cookie, {
      maxAge: configService.get<number>('session.maxAge'),
    })
  }

  app.use(session(sessionConfig))
  // 设置passport，并启用session
  app.use(passport.initialize())
  app.use(passport.session())

  const documentConfig = new DocumentBuilder()
    .setTitle(configService.get<string>('app.title'))
    .setDescription(configService.get<string>('app.description'))
    .setVersion(info.version)
    .build()

  if (configService.get<boolean>('development')) {
    const document = SwaggerModule.createDocument(app, documentConfig)
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        requestInterceptor: (req) => {
          req.credentials = 'include'
          return req
        },
      },
    })
  }
  else {
    const document = SwaggerModule.createDocument(app, documentConfig, {
      include: SwaggerPublic,
    })
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        requestInterceptor: (req) => {
          req.credentials = 'include'
          return req
        },
      },
    })
  }

  await app.listen(configService.get<number>('app.port'))

  return configService
}
bootstrap().then((configService: ConfigService) =>
  console.log(
    `Server is running on port ${configService.get<number>('app.port')}`,
  ),
)

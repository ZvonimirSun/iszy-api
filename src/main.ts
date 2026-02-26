import type { NestExpressApplication } from '@nestjs/platform-express'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { json, urlencoded } from 'body-parser'
import { Logger } from '~shared'
import info from '../package.json'
import { AppModule } from './app.module'
import SwaggerPublic from './swagger.public'
import 'dayjs/locale/zh-cn'

const logger = new Logger()
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
  })

  const configService: ConfigService = app.get(ConfigService)

  const bodyLimit = configService.get<string>('app.bodyLimit')
  app.use(json({ limit: bodyLimit }))
  app.use(urlencoded({ limit: bodyLimit, extended: true }))
  app.set('query parser', 'extended')
  app.disable('x-powered-by')
  app.enableCors({
    origin(requestOrigin, callback) {
      const origins = configService.get<string[]>('app.allowOrigins')
      if (origins != null) {
        if (origins.includes(requestOrigin))
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

  const behindProxy = configService.get<boolean>('behindProxy')
  const trustProxy = configService.get<string>('trustProxy')
  if (behindProxy || trustProxy) {
    if (trustProxy) {
      const defaultTrustProxy = 'loopback, linklocal, uniquelocal'
      if (trustProxy === 'default') {
        app.set('trust proxy', defaultTrustProxy)
      }
      else {
        app.set('trust proxy', `${defaultTrustProxy}, ${trustProxy}`)
      }
    }
    else {
      app.set('trust proxy', true)
    }
  }

  const documentConfig = new DocumentBuilder()
    .addBearerAuth()
    .setTitle(configService.get<string>('app.title'))
    .setDescription(configService.get<string>('app.description'))
    .setVersion(info.version)
    .build()

  if (configService.get<boolean>('development')) {
    const document = SwaggerModule.createDocument(app, documentConfig)
    SwaggerModule.setup('api', app, document)
  }
  else {
    const document = SwaggerModule.createDocument(app, documentConfig, {
      include: SwaggerPublic,
    })
    SwaggerModule.setup('api', app, document)
  }

  await app.listen(configService.get<number>('app.port'))

  return configService
}
bootstrap().then((configService: ConfigService) => {
  logger.log(`Server is running on port ${configService.get<number>('app.port')}`)
})

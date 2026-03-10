import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { json, urlencoded } from 'body-parser'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { PublicDomains } from '~domains/domains'
import { AppConfig, Logger } from '~shared'
import info from '../../package.json'
import 'dayjs/locale/zh-cn'

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  private readonly logger = new Logger()

  static beforeCreate() {
    // 全局配置 dayjs
    dayjs.locale('zh-cn') // 全局中文
    dayjs.extend(utc) // 扩展 UTC 功能
    dayjs.extend(timezone)// 扩展时区功能
    dayjs.extend(customParseFormat) // 扩展自定义时间格式解析
    dayjs.tz.setDefault('Asia/Shanghai') // 全局默认时区
  }

  configure(app: NestExpressApplication) {
    this.configureGeneral(app)
    this.configureCors(app)
    this.configureProxy(app)
    this.configureSwagger(app)
  }

  async startUp(app: NestExpressApplication) {
    const config = this.configService.get<AppConfig>('app')
    const port = config.port
    await app.listen(port)
    this.logger.log(`Server is running on port ${port}`)
  }

  private configureGeneral(app: NestExpressApplication) {
    const config = this.configService.get<AppConfig>('app')
    const bodyLimit = config.bodyLimit
    app.use(json({ limit: bodyLimit }))
    app.use(urlencoded({ limit: bodyLimit, extended: true }))
    app.set('query parser', 'extended')
    app.disable('x-powered-by')
  }

  private configureCors(app: NestExpressApplication) {
    const config = this.configService.get<AppConfig>('app')
    const origins = config.allowOrigins
    const origin = config.origin
    app.enableCors({
      origin(requestOrigin, callback) {
        if (!requestOrigin) {
          return callback(null, true) // 直接允许
        }
        if (!origins) {
          return callback(null, requestOrigin) // 直接允许
        }
        const allowOrigins = origins.split(',').map(item => item.trim()).filter(Boolean)
        if (allowOrigins.includes(requestOrigin) || requestOrigin === origin)
          callback(null, requestOrigin)
        else
          callback(new Error(`Not allow origin ${requestOrigin}`))
      },
      credentials: true,
    })
  }

  private configureProxy(app: NestExpressApplication) {
    const behindProxy = this.configService.get<boolean>('behindProxy')
    const trustProxy = this.configService.get<string>('trustProxy')
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
  }

  private configureSwagger(app: NestExpressApplication) {
    const config = this.configService.get<AppConfig>('app')
    const documentConfig = new DocumentBuilder()
      .addBearerAuth()
      .setTitle(config.title)
      .setDescription(config.description)
      .setVersion(info.version)
      .build()

    const document = SwaggerModule.createDocument(app, documentConfig, {
      include: this.configService.get<boolean>('development')
        ? undefined
        : PublicDomains,
    })
    SwaggerModule.setup('api', app, document)
  }
}

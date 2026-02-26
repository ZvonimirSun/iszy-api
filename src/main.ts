import type { NestExpressApplication } from '@nestjs/platform-express'
import { NestFactory } from '@nestjs/core'
import { Logger } from '~shared'
import { AppConfigService } from '~/shared/app-config.service'
import { AppModule } from './app.module'

AppConfigService.beforeCreate()
NestFactory.create<NestExpressApplication>(AppModule, {
  logger: new Logger(),
}).then(async (app) => {
  const appConfigService: AppConfigService = app.get(AppConfigService)
  appConfigService.configure(app)
  await appConfigService.startUp(app)
})

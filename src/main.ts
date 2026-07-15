import type { NestExpressApplication } from '@nestjs/platform-express'
import { NestFactory } from '@nestjs/core'
import { RtcSignalingService } from '~domains/rtc/rtc-signaling.service'
import { Logger } from '~shared'
import { AppConfigService } from '~/shared/app-config.service'
import { AppModule } from './app.module'

AppConfigService.beforeCreate()
NestFactory.create<NestExpressApplication>(AppModule, {
  logger: new Logger(),
}).then(async (app) => {
  const appConfigService: AppConfigService = app.get(AppConfigService)
  const rtcSignalingService: RtcSignalingService = app.get(RtcSignalingService, { strict: false })
  appConfigService.configure(app)
  rtcSignalingService.bind(app.getHttpServer())
  await appConfigService.startUp(app)
})

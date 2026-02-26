import { Global, Module, OnModuleInit } from '@nestjs/common'
import { APP_FILTER, APP_PIPE } from '@nestjs/core'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { AppValidationPipe, HttpExceptionFilter, Logger } from '~shared'
import 'dayjs/locale/zh-cn'

@Global()
@Module({
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_PIPE, useClass: AppValidationPipe },
  ],
})
export class SharedModule implements OnModuleInit {
  private readonly logger = new Logger()

  onModuleInit() {
    this.logger.log('初始化dayjs功能')
    // 全局配置 dayjs
    dayjs.locale('zh-cn') // 全局中文
    dayjs.extend(utc) // 扩展 UTC 功能
    dayjs.extend(timezone)// 扩展时区功能
    dayjs.extend(customParseFormat) // 扩展自定义时间格式解析
    dayjs.tz.setDefault('Asia/Shanghai') // 全局默认时区
  }
}

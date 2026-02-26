import { Global, Module } from '@nestjs/common'
import { APP_FILTER, APP_PIPE } from '@nestjs/core'
import { AppValidationPipe, HttpExceptionFilter } from '~shared'
import { AppConfigService } from './app-config.service'

@Global()
@Module({
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_PIPE, useClass: AppValidationPipe },
    AppConfigService,
  ],
  exports: [AppConfigService],
})
export class SharedModule {}

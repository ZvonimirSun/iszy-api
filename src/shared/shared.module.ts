import { Global, Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core'
import { AppValidationPipe, HttpExceptionFilter, JwtAuthGuard, JwtStrategy } from '~shared'
import { AppConfigService } from './app-config.service'

@Global()
@Module({
  providers: [
    AppConfigService,
    JwtStrategy,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_PIPE, useClass: AppValidationPipe },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [AppConfigService],
})
export class SharedModule {}

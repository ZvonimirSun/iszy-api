import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthModule } from '~domains/auth/auth.module'
import { UserModule } from '~domains/user/user.module'
import { OauthStateStore } from '../store/oauth-state-store'
import { SsoCompletionStore } from './store/sso-completion-store'
import { SsoAuthGuard } from './sso-auth.guard'
import { SsoCompletionGuard } from './sso-completion.guard'
import { SsoController } from './sso.controller'
import { SsoService } from './sso.service'
import { SsoStrategy } from './sso.strategy'

@Module({
  imports: [AuthModule, UserModule],
  controllers: [SsoController],
  providers: [
    SsoService,
    {
      provide: SsoStrategy,
      inject: [ConfigService, SsoService],
      useFactory: (configService: ConfigService, ssoService: SsoService) => {
        if (!ssoService.isEnabled()) {
          return null
        }
        return new SsoStrategy(configService, ssoService)
      },
    },
    SsoAuthGuard,
    SsoCompletionGuard,
    SsoCompletionStore,
    OauthStateStore,
  ],
})
export class SsoModule {}

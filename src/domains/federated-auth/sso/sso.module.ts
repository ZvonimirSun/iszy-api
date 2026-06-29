import { Module } from '@nestjs/common'
import { AuthModule } from '~domains/auth/auth.module'
import { UserModule } from '~domains/user/user.module'
import { OauthStateStore } from '../store/oauth-state-store'
import { SsoAuthGuard } from './sso-auth.guard'
import { SsoBindStore } from './sso-bind.store'
import { SsoController } from './sso.controller'
import { SsoService } from './sso.service'
import { SsoStrategy } from './sso.strategy'

@Module({
  imports: [AuthModule, UserModule],
  controllers: [SsoController],
  providers: [
    SsoService,
    SsoStrategy,
    SsoAuthGuard,
    SsoBindStore,
    OauthStateStore,
  ],
})
export class SsoModule {}

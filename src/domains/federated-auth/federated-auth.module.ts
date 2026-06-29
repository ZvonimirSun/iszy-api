import { Module } from '@nestjs/common'
import { OauthModule } from './oauth/oauth.module'
import { SsoModule } from './sso/sso.module'

@Module({
  imports: [OauthModule, SsoModule],
})
export class FederatedAuthModule {}

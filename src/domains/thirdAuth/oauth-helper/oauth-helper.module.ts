import { Global, Module } from '@nestjs/common'
import { OauthHelperService } from './oauth-helper.service'
import { OauthStore } from './store/oauth-store'

@Global()
@Module({
  providers: [OauthStore, OauthHelperService],
  exports: [OauthStore, OauthHelperService],
})
export class OauthHelperModule {}

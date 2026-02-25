import { Global, Module } from '@nestjs/common'
import { OauthStore } from './store/oauth-store'

@Global()
@Module({
  providers: [OauthStore],
  exports: [OauthStore],
})
export class OauthModule {}

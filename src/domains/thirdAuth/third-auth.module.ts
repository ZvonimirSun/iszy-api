import { Module } from '@nestjs/common'
import { GithubAuthModule } from './github/github-auth.module'
import { LinuxdoAuthModule } from './linuxdo/linuxdo-auth.module'
import { OauthHelperModule } from './oauth-helper/oauth-helper.module'

@Module({
  imports: [OauthHelperModule, GithubAuthModule, LinuxdoAuthModule],
})
export class ThirdAuthModule {}

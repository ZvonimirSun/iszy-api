import { Module } from '@nestjs/common'
import { GithubAuthModule } from './github/github-auth.module'
import { LinuxdoAuthModule } from './linuxdo/linuxdo-auth.module'
import { OauthModule } from './oauth-csrf/oauth.module'

@Module({
  imports: [OauthModule, GithubAuthModule, LinuxdoAuthModule],
})
export class ThirdAuthModule {}

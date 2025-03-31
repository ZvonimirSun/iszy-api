import { Module } from '@nestjs/common'
import { GithubAuthModule } from './github/github-auth.module'
import { LinuxdoAuthModule } from './linuxdo/linuxdo-auth.module'

@Module({
  imports: [GithubAuthModule, LinuxdoAuthModule],
})
export class ThirdAuthModule {}

import { Module } from '@nestjs/common'
import { GithubAuthModule } from './github/github-auth.module'

@Module({
  imports: [GithubAuthModule],
})
export class ThirdAuthModule {}

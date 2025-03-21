import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { GithubAuthController } from './github-auth.controller'
import { GithubAuthService } from './github-auth.service'
import { GithubStrategy } from './github.strategy'

@Module({
  imports: [PassportModule],
  controllers: [GithubAuthController],
  providers: [GithubAuthService, GithubStrategy],
})
export class GithubAuthModule {}

import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { UserModule } from '~modules/user/user.module'
import { GithubAuthController } from './github-auth.controller'
import { GithubAuthService } from './github-auth.service'
import { GithubStrategy } from './github.strategy'

@Module({
  imports: [PassportModule, UserModule],
  controllers: [GithubAuthController],
  providers: [GithubAuthService, GithubStrategy],
  exports: [],
})
export class GithubAuthModule {}

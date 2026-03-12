import { Module } from '@nestjs/common'
import { UserModule } from '~domains/user/user.module'
import { GithubController } from './github.controller'
import { GithubAuthGuard } from './guard/github-auth.guard'
import { LinuxdoAuthGuard } from './guard/linuxdo-auth.guard'
import { LinuxdoController } from './linuxdo.controller'
import { OauthController } from './oauth.controller'
import { OauthService } from './oauth.service'
import { CodeStore } from './store/code-store'
import { StateStore } from './store/state-store'
import { GithubStrategy } from './strategy/github.strategy'
import { LinuxdoStrategy } from './strategy/linuxdo.strategy'

@Module({
  imports: [UserModule, UserModule],
  controllers: [OauthController, GithubController, LinuxdoController],
  providers: [
    OauthService,
    GithubStrategy,
    LinuxdoStrategy,
    GithubAuthGuard,
    LinuxdoAuthGuard,
    StateStore,
    CodeStore,
  ],
  exports: [
    CodeStore,
  ],
})
export class OauthModule {}

import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthModule } from '~domains/auth/auth.module'
import { UserModule } from '~domains/user/user.module'
import { OauthStateStore } from '../store/oauth-state-store'
import { GithubController } from './github.controller'
import { GithubAuthGuard } from './guard/github-auth.guard'
import { LinuxdoAuthGuard } from './guard/linuxdo-auth.guard'
import { LinuxdoController } from './linuxdo.controller'
import { OauthController } from './oauth.controller'
import { OauthService } from './oauth.service'
import { GithubStrategy } from './strategy/github.strategy'
import { LinuxdoStrategy } from './strategy/linuxdo.strategy'

@Module({
  imports: [UserModule, AuthModule],
  controllers: [OauthController, GithubController, LinuxdoController],
  providers: [
    OauthService,
    {
      provide: GithubStrategy,
      inject: [ConfigService, OauthService],
      useFactory: (configService: ConfigService, oauthService: OauthService) => {
        if (!oauthService.isProviderEnabled('github')) {
          return null
        }
        return new GithubStrategy(configService, oauthService)
      },
    },
    {
      provide: LinuxdoStrategy,
      inject: [ConfigService, OauthService],
      useFactory: (configService: ConfigService, oauthService: OauthService) => {
        if (!oauthService.isProviderEnabled('linuxdo')) {
          return null
        }
        return new LinuxdoStrategy(configService, oauthService)
      },
    },
    GithubAuthGuard,
    LinuxdoAuthGuard,
    OauthStateStore,
  ],
})
export class OauthModule {}

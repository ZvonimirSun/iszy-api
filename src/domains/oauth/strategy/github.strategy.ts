import type { AppConfig } from '~shared'
import { Injectable, Req, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-github2'
import { generateDevice } from '~domains/auth/utils/generateDevice'
import { OauthService } from '~domains/oauth/oauth.service'
import { AuthRequest, OAuthProviderConfig } from '~shared'

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, private oauthService: OauthService) {
    const appConfig = configService.get<AppConfig>('app')
    const oauthConfig = configService.get<OAuthProviderConfig>('auth.github')
    super({
      passReqToCallback: true,
      clientID: oauthConfig.clientId,
      clientSecret: oauthConfig.clientSecret,
      callbackURL: `${appConfig.origin}/oauth/github/callback`,
      scope: ['user:email'],
    })
  }

  async validate(
    @Req() req: AuthRequest,
    _accessToken: string,
    _refreshToken: any,
    profile: any,
  ) {
    req.device = generateDevice(req)
    req.thirdPartProfile = profile
    try {
      return await this.oauthService.validateUser('github', profile.id)
    }
    catch (e) {
      throw new UnauthorizedException('Github 认证失败')
    }
  }
}

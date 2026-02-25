import type { AuthRequest } from '~types/AuthRequest'
import { Injectable, Req, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { Strategy } from 'passport-github2'
import { generateDevice } from '~domains/auth/utils/generateDevice'
import { GithubAuthService } from './github-auth.service'

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, private githubAuthService: GithubAuthService) {
    super({
      passReqToCallback: true,
      clientID: configService.get<string>('auth.github.clientId'),
      clientSecret: configService.get<string>('auth.github.clientSecret'),
      callbackURL: configService.get<string>('auth.github.callbackUrl'),
      scope: ['user:email'],
    })
    const systemProxy = configService.get<string>('systemProxy')
    if (systemProxy) {
      const httpsProxyAgent = new HttpsProxyAgent(systemProxy)
      this._oauth2.setAgent(httpsProxyAgent)
    }
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
      return await this.githubAuthService.validateUser(profile)
    }
    catch (e) {
      throw new UnauthorizedException('Github 认证失败')
    }
  }
}

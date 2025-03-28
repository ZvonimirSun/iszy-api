import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { Strategy } from 'passport-github2'
import { GithubAuthService } from './github-auth.service'

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, private githubAuthService: GithubAuthService) {
    super({
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
    _accessToken: string,
    _refreshToken: any,
    profile: any,
  ) {
    return await this.githubAuthService.validateUser(profile)
  }
}

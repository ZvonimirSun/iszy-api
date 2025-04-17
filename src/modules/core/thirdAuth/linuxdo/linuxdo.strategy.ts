import type { AuthRequest } from '~types/AuthRequest'
import { Injectable, Req, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { InternalOAuthError, Strategy } from 'passport-oauth2'
import { generateDevice } from '~utils/generateDevice'
import { LinuxdoAuthService } from './linuxdo-auth.service'

@Injectable()
export class LinuxdoStrategy extends PassportStrategy(Strategy, 'linuxdo') {
  private readonly _userProfileURL: string

  constructor(configService: ConfigService, private linuxdoAuthService: LinuxdoAuthService) {
    super({
      passReqToCallback: true,
      authorizationURL: 'https://connect.linux.do/oauth2/authorize',
      tokenURL: 'https://connect.linux.do/oauth2/token',
      clientID: configService.get<string>('auth.linuxdo.clientId'),
      clientSecret: configService.get<string>('auth.linuxdo.clientSecret'),
      callbackURL: configService.get<string>('auth.linuxdo.callbackUrl'),
    })
    const systemProxy = configService.get<string>('systemProxy')
    if (systemProxy) {
      const httpsProxyAgent = new HttpsProxyAgent(systemProxy)
      this._oauth2.setAgent(httpsProxyAgent)
    }
    this._userProfileURL = 'https://connect.linux.do/api/user'
    this._oauth2.useAuthorizationHeaderforGET(true)
  }

  async userProfile(accessToken: string, done: (err: Error | null, profile?: any) => void) {
    this._oauth2.get(this._userProfileURL, accessToken, (err, body: string, res) => {
      if (err) {
        return done(new InternalOAuthError('Failed to fetch user profile', err))
      }
      try {
        const profile = JSON.parse(body)
        profile.id = profile.id.toString()
        done(null, profile)
      }
      catch (ex) {
        return done(new Error('Failed to parse user profile'))
      }
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
      return await this.linuxdoAuthService.validateUser(profile)
    }
    catch (e) {
      throw new UnauthorizedException()
    }
  }
}

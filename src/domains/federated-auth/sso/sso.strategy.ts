import type { AppConfig, AuthRequest, SsoOidcConfig } from '~shared'
import { Injectable, Req, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { InternalOAuthError, Strategy } from 'passport-oauth2'
import { generateDevice } from '~domains/auth/utils/generateDevice'
import { SsoService } from './sso.service'

@Injectable()
export class SsoStrategy extends PassportStrategy(Strategy, 'sso') {
  private readonly _userInfoURL: string

  constructor(configService: ConfigService, private ssoService: SsoService) {
    const appConfig = configService.get<AppConfig>('app')
    const ssoConfig = configService.get<SsoOidcConfig>('auth.sso')
    const ssoOrigin = ssoConfig.origin.replace(/\/$/, '')
    super({
      passReqToCallback: true,
      authorizationURL: `${ssoOrigin}/application/o/authorize/`,
      tokenURL: `${ssoOrigin}/application/o/token/`,
      clientID: ssoConfig.clientId,
      clientSecret: ssoConfig.clientSecret,
      callbackURL: `${appConfig.origin}/oauth/sso/callback`,
      scope: ['openid', 'profile', 'email'],
    })
    this._userInfoURL = `${ssoOrigin}/application/o/userinfo/`
    this._oauth2.useAuthorizationHeaderforGET(true)
  }

  async userProfile(accessToken: string, done: (err: Error | null, profile?: any) => void) {
    this._oauth2.get(this._userInfoURL, accessToken, (err, body) => {
      if (err) {
        return done(new InternalOAuthError('Failed to fetch SSO user profile', err))
      }
      try {
        const profile = JSON.parse(body.toString())
        profile.id = profile.sub?.toString() ?? profile.id?.toString()
        done(null, profile)
      }
      catch {
        return done(new Error('Failed to parse SSO user profile'))
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
      return await this.ssoService.validateUser(profile.id, profile)
    }
    catch {
      throw new UnauthorizedException('SSO 认证失败')
    }
  }
}

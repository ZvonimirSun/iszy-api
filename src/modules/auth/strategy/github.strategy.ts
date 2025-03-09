import type { AuthRequest } from '~types/AuthRequest'
import { promisify } from 'node:util'
import { Injectable, Req, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-github2'
import { PublicUser } from '~entities/user/user.model'
import { AuthService } from '~modules/auth/auth.service'

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, private authService: AuthService) {
    super({
      passReqToCallback: true,
      clientID: configService.get<string>('auth.github.clientId'),
      clientSecret: configService.get<string>('auth.github.clientSecret'),
      callbackURL: configService.get<string>('auth.github.callbackUrl'),
      scope: [],
    })
  }

  async validate(
    @Req() req: AuthRequest,
    _accessToken: string,
    _refreshToken: any,
    profile: {
      id: string
    },
  ) {
    let user: PublicUser
    try {
      user = await this.authService.validateGithub(profile.id)
    }
    catch (e) {
      // 如果用户名密码不匹配，清理session
      await promisify(req.logout.bind(req))()
      throw new UnauthorizedException(e)
    }
    // 用户名密码匹配，设置session
    // promisify，统一代码风格，将node式callback转化为promise
    await promisify(req.login.bind(req))(user)
    return user
  }
}

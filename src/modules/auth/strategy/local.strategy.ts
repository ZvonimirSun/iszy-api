import type { PublicUser } from '~entities/user/user.model'
import type { AuthRequest } from '~types/AuthRequest'
import { promisify } from 'node:util'
import { Injectable, Req, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { AuthService } from '../auth.service'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      passReqToCallback: true,
    })
  }

  async validate(
    @Req() req: AuthRequest,
    username: string,
    password: string,
  ): Promise<any> {
    let user: PublicUser
    try {
      user = await this.authService.validateUser(username, password)
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

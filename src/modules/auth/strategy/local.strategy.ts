import { promisify } from 'node:util'
import { Strategy } from 'passport-local'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, Req, UnauthorizedException } from '@nestjs/common'
import { AuthService } from '../auth.service'
import type { AuthRequest } from '~types/AuthRequest'
import type { User } from '~entities/user/user.model'

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
    let user: Partial<User>
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

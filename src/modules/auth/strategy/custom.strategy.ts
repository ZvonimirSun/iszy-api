import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-custom'
import { Injectable, Req, UnauthorizedException } from '@nestjs/common'
import type { AuthRequest } from '~types/AuthRequest'
import { User } from '~entities/user/user.model'

@Injectable()
export class CustomStrategy extends PassportStrategy(Strategy) {
  async validate(@Req() req: AuthRequest): Promise<Partial<User>> {
    // 注意，passport的session数据结构，使用req.session.passport.user来访问 user session
    const user = req.session?.passport?.user

    if (!user)
      throw new UnauthorizedException()

    // 这里的userId和username是上面local.strategy在调用login()函数的时候，passport添加到session中的。
    // 数据结构保持一致即可
    return user
  }
}

import type { AuthRequest } from '~types/AuthRequest'
import { Injectable, Req, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { generateDevice } from '~utils/generateDevice'
import { AuthService } from './auth.service'

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
    try {
      const user = await this.authService.validateUser(username, password)
      req.device = generateDevice(req)
      return user
    }
    catch (e) {
      throw new UnauthorizedException(e)
    }
  }
}

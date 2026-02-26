import type { AuthRequest } from '~shared'
import { Injectable, Req, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { AuthService } from '../auth.service'
import { generateDevice } from '../utils/generateDevice'

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

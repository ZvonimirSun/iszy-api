import type { AuthRequest } from '~shared'
import { Injectable, Req, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { AuthService } from '../auth.service'
import { LoginAttemptStore } from '../store/login-attempt-store'
import { generateDevice } from '../utils/generateDevice'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private loginAttemptStore: LoginAttemptStore,
  ) {
    super({
      passReqToCallback: true,
    })
  }

  async validate(
    @Req() req: AuthRequest,
    username: string,
    password: string,
  ): Promise<any> {
    const userName = username.toLowerCase()
    const ip = req.ip || 'unknown'
    await this.loginAttemptStore.assertAllowed(userName, ip)

    try {
      const user = await this.authService.validateUser(userName, password)
      await this.loginAttemptStore.reset(userName, ip)
      req.device = generateDevice(req)
      return user
    }
    catch (e) {
      const attemptInfo = await this.loginAttemptStore.recordFailure(userName, ip)
      if (e instanceof UnauthorizedException)
        throw e
      throw new UnauthorizedException({
        message: e instanceof Error ? e.message : e,
        data: attemptInfo,
      })
    }
  }
}

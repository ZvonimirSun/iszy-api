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
    const loginIdentifier = username.trim().toLowerCase()
    const ip = req.ip || 'unknown'
    // Keep the cheap IP/input ban check ahead of the user lookup. Email aliases
    // are then mapped to the canonical username so both identifiers share the
    // same account-level counter.
    await this.loginAttemptStore.assertAllowed(loginIdentifier, ip)
    const loginAttemptKey = await this.authService.getLoginAttemptKey(loginIdentifier)
    if (loginAttemptKey !== loginIdentifier) {
      await this.loginAttemptStore.assertAllowed(loginAttemptKey, ip)
    }

    try {
      const user = await this.authService.validateUser(loginIdentifier, password)
      await this.loginAttemptStore.reset(loginAttemptKey)
      req.device = generateDevice(req)
      return user
    }
    catch (e) {
      const attemptInfo = await this.loginAttemptStore.recordFailure(loginAttemptKey, ip)
      if (e instanceof UnauthorizedException)
        throw e
      throw new UnauthorizedException({
        message: e instanceof Error ? e.message : e,
        data: attemptInfo,
      })
    }
  }
}

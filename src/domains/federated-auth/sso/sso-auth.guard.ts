import { ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard, IAuthModuleOptions } from '@nestjs/passport'
import { AuthRequest } from '~shared'
import { SsoService } from './sso.service'

@Injectable()
export class SsoAuthGuard extends AuthGuard('sso') {
  constructor(private ssoService: SsoService) {
    super()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: AuthRequest = context.switchToHttp().getRequest()
    await this.ssoService.canActive(req)
    try {
      await super.canActivate(context)
    }
    catch (e) {
    }
    return true
  }

  getAuthenticateOptions(context: ExecutionContext): IAuthModuleOptions {
    const req: AuthRequest = context.switchToHttp().getRequest()
    if (req.state) {
      return {
        state: req.state,
      }
    }
    return {}
  }
}

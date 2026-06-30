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
    this.ssoService.assertEnabled()
    await this.ssoService.canActive(req)
    const result = await super.canActivate(context)
    return result as boolean
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

  handleRequest(err: Error | null, user: any, info: any, context: ExecutionContext) {
    const req: AuthRequest = context.switchToHttp().getRequest()
    if (!err && !user && req.path.endsWith('/callback') && req.thirdPartProfile) {
      return null
    }
    return super.handleRequest(err, user, info, context)
  }
}

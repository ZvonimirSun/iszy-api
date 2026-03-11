import { ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard, IAuthModuleOptions } from '@nestjs/passport'
import { OauthService } from '~domains/oauth/oauth.service'
import { AuthRequest } from '~shared'

@Injectable()
export class LinuxdoAuthGuard extends AuthGuard('linuxdo') {
  constructor(private oauthService: OauthService) {
    super()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: AuthRequest = context.switchToHttp().getRequest()
    await this.oauthService.canActive(req)
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

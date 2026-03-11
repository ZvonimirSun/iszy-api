import { ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard, IAuthModuleOptions } from '@nestjs/passport'
import { AuthRequest } from '~shared'
import { OauthHelperService } from '../oauth-helper/oauth-helper.service'

@Injectable()
export class LinuxdoAuthGuard extends AuthGuard('linuxdo') {
  constructor(private oauthService: OauthHelperService) {
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

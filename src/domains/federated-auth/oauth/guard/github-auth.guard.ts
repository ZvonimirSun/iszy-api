import { ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard, IAuthModuleOptions } from '@nestjs/passport'
import { AuthRequest } from '~shared'
import { OauthService } from '../oauth.service'

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  constructor(private oauthService: OauthService) {
    super()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: AuthRequest = context.switchToHttp().getRequest()
    this.oauthService.assertProviderEnabled('github')
    await this.oauthService.canActive(req, 'github')
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
}

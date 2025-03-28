import { ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { AuthRequest } from '~types/AuthRequest'

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  async canActivate(context: ExecutionContext) {
    const req: AuthRequest = context.switchToHttp().getRequest()
    const path = req.path
    if (path.endsWith('/bind')) {
      req.session.bindGithub = true
    }
    else if (!path.endsWith('/callback')) {
      delete req.session.bindGithub
    }
    let activateError: Error
    try {
      super.canActivate(context)
    }
    catch (e) {
      activateError = e
    }
    if (activateError && !req.session.bindGithub) {
      throw activateError
    }
    return true
  }
}

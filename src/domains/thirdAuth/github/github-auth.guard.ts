import { promisify } from 'node:util'
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
      await promisify(req.session.destroy.bind(req.session))()
    }
    try {
      await super.canActivate(context)
    }
    catch (e) {
    }
    return true
  }
}

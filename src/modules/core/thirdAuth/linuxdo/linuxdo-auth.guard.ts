import { ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { AuthRequest } from '~types/AuthRequest'

@Injectable()
export class LinuxdoAuthGuard extends AuthGuard('linuxdo') {
  async canActivate(context: ExecutionContext) {
    const req: AuthRequest = context.switchToHttp().getRequest()
    const path = req.path
    if (path.endsWith('/bind')) {
      req.session.bindLinuxdo = true
    }
    else if (!path.endsWith('/callback')) {
      delete req.session.bindLinuxdo
    }
    try {
      await super.canActivate(context)
    }
    catch (e) {
    }
    return true
  }
}

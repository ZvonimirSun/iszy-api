import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthGuard, IAuthModuleOptions } from '@nestjs/passport'
import { AuthRequest } from '~types/AuthRequest'
import { OauthStore } from '../oauth-csrf/store/oauth-store'

@Injectable()
export class LinuxdoAuthGuard extends AuthGuard('linuxdo') {
  constructor(private oauthStore: OauthStore) {
    super()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: AuthRequest = context.switchToHttp().getRequest()
    const path = req.path
    if (path.endsWith('/unbind')) {
      return true
    }
    if (path.endsWith('/callback')) {
      const { state } = req.query
      if (typeof state !== 'string') {
        throw new UnauthorizedException('缺少 state 参数')
      }
      const stateData = await this.oauthStore.getState(state)
      if (!stateData) {
        throw new UnauthorizedException('无效的 state 参数')
      }
      req.isBind = !!stateData.user
      if (req.isBind) {
        req.user = stateData.user
      }
      await this.oauthStore.removeState(state)
    }
    else {
      const state = crypto.randomUUID()
      await this.oauthStore.setState(state, path.endsWith('/bind')
        ? {
            user: req.user,
          }
        : {})
      req.state = state
    }
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

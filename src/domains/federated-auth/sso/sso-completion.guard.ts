import type { AuthRequest } from '~shared'
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { SsoCompletionStore } from './store/sso-completion-store'

@Injectable()
export class SsoCompletionGuard implements CanActivate {
  constructor(
    private readonly completionStore: SsoCompletionStore,
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>()
    const pendingToken = req.body?.pendingToken
    req.ssoCompletion = await this.completionStore.getOrThrow(
      typeof pendingToken === 'string' ? pendingToken : '',
    )
    return true
  }
}

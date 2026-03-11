import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AppConfig, AuthRequest, StateData } from '~shared'
import { OauthStore } from './store/oauth-store'

@Injectable()
export class OauthHelperService {
  constructor(
    private readonly oauthStore: OauthStore,
    private readonly configService: ConfigService,
  ) {}

  async canActive(req: AuthRequest) {
    const path = req.path
    if (path.endsWith('/unbind')) {
      return true
    }
    // 回调
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
      req.oauthCallbackData = stateData.callbackData
      await this.oauthStore.removeState(state)
    }
    else {
      const state = crypto.randomUUID()
      const stateData: StateData = path.endsWith('/bind')
        ? {
            user: req.user,
          }
        : {}
      const origin = req.query.client as string | undefined
      if (!this._isAllowedOrigin(origin)) {
        throw new UnauthorizedException('不允许的来源')
      }
      else if (req.query.state && origin) {
        stateData.callbackData = {
          state: req.query.state as string,
          redirect_uri: `${req.query.client}/api/auth/github/callback`,
        }
      }
      await this.oauthStore.setState(state, stateData)
      req.state = state
    }
  }

  private _isAllowedOrigin(requestOrigin?: string) {
    if (!requestOrigin) {
      return true
    }
    const config = this.configService.get<AppConfig>('app')
    const origins = config.allowOrigins
    const origin = config.origin
    if (!origins) {
      return true
    }
    const allowOrigins = origins.split(',').map(item => item.trim()).filter(Boolean)
    return allowOrigins.includes(requestOrigin) || requestOrigin === origin
  }
}

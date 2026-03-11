import type { Response } from 'express'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthService } from '~domains/auth/auth.service'
import { TicketStore } from '~domains/auth/store/ticket-store'
import { AppConfig, AuthConfig, AuthRequest, Logger, OauthProvider, StateData } from '~shared'
import { OauthStore } from './store/oauth-store'

@Injectable()
export class OauthHelperService {
  constructor(
    private readonly oauthStore: OauthStore,
    private readonly configService: ConfigService,
    private authService: AuthService,
    private ticketStore: TicketStore,
  ) {}

  private readonly logger = new Logger(OauthHelperService.name)

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

  async callbackHandler(req: AuthRequest, res: Response, { authProvider, title }: { authProvider: OauthProvider, title: string }) {
    let bodyInfo = ''
    let msgInfo: any
    if (req.isBind) {
      if (!req.user) {
        throw new UnauthorizedException('用户未登录，无法绑定')
      }
      const data = await authProvider.bind(req.user, req.thirdPartProfile)
      if (req.oauthCallbackData) {
        const { state, redirect_uri } = req.oauthCallbackData
        return res.redirect(302, `${redirect_uri}?state=${state}${data.type !== 'bind_success' ? `&error=${data.data}` : ''}`)
      }
      if (data.type === 'bind_success') {
        bodyInfo = '验证成功'
        msgInfo = data
      }
      else {
        bodyInfo = data.data
        msgInfo = data
      }
    }
    // 登录
    else {
      bodyInfo = '登录完成'
      if (req.user || this.configService.get<AuthConfig>('auth').publicRegister) {
        if (!req.user) {
          // 用户不存在
          req.user = await authProvider.register(req.thirdPartProfile)
        }
        this.logger.log(`${req.user.userName}通过 ${title} 登录成功`)
        if (req.oauthCallbackData) {
          const { state, redirect_uri } = req.oauthCallbackData
          const ticket = await this.ticketStore.createTicket(req.user.userId)
          return res.redirect(302, `${redirect_uri}?state=${state}&code=${ticket}`)
        }
        msgInfo = {
          type: 'oauth_complete',
          data: await this.authService.generateToken(req.user, req.device),
        }
      }
      else {
        if (req.oauthCallbackData) {
          const { state, redirect_uri } = req.oauthCallbackData
          res.redirect(302, `${redirect_uri}?state=${state}&error=登陆失败`)
          return
        }
        bodyInfo = '登录失败'
        msgInfo = {
          type: 'oauth_fail',
          data: '登陆失败',
        }
      }
      return `
        <body>
          ${bodyInfo}
          <script>
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(${JSON.stringify(msgInfo)}, '*');
            }
          </script>
        </body>
      `
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

import type { Response } from 'express'
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Device, PublicUser } from '@zvonimirsun/iszy-common'
import { AuthService } from '~domains/auth/auth.service'
import { CodeStore } from '~domains/auth/store/code-store'
import { UserService } from '~domains/user/user.service'
import {
  AppConfig,
  AuthConfig,
  AuthRequest,
  Logger,
  MinimalUser,
  OAuthProviderType,
  random,
  StateData,
  toPublicUser,
} from '~shared'
import { OauthStateStore } from '../store/oauth-state-store'
import Provider from './providers'

@Injectable()
export class OauthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly oauthStore: OauthStateStore,
    private readonly codeStore: CodeStore,
  ) {}

  private readonly logger = new Logger(OauthService.name)

  async getCode(user: MinimalUser) {
    return this.codeStore.createCode(user.userId)
  }

  async getToken(user: MinimalUser, device: Device) {
    return this.authService.generateToken(user, device)
  }

  async unbind(user: MinimalUser, provider: OAuthProviderType | 'sso') {
    if (provider === 'sso') {
      const currentUser = await this.userService.findOne(user.userId)
      if (!currentUser.passwd) {
        throw new BadRequestException('请先设置登录密码后再解绑 SSO')
      }
    }
    await this.userService.updateUser({
      userId: user.userId,
      [provider]: null,
    })
  }

  async bind(user: MinimalUser, provider: OAuthProviderType, id: string) {
    const tmpUser = await this.userService.find({
      [provider]: id,
    })
    if (tmpUser) {
      throw new Error(`${Provider[provider].title} 用户已被占用`)
    }
    await this.userService.updateUser({
      userId: user.userId,
      [provider]: id,
    })
  }

  async register(provider: OAuthProviderType, profile: any) {
    try {
      const userData = Provider[provider].normalizeProfile(profile)
      const testUser = await this.userService.findOne(userData.userId)
      if (testUser) {
        userData.userName = `${userData.userName}_${random(4)}`
      }
      return await this.userService.create(userData)
    }
    catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        const error = e.errors[0]
        if (error) {
          this.logger.debug('OAuth 注册触发唯一约束', {
            provider,
            path: error.path,
            message: error.message,
          })
          switch (error.path) {
            case 'email': {
              throw new Error('邮箱已被绑定')
            }
            case 'github': {
              throw new Error(`${Provider[provider].title}账号已被绑定`)
            }
            default: {
              throw new Error(error.message)
            }
          }
        }
        else {
          throw new Error(e.name)
        }
      }
      else {
        throw new Error(e.name)
      }
    }
  }

  async validateUser(provider: OAuthProviderType, id: string): Promise<PublicUser> {
    const user = await this.userService.find({
      [provider]: id,
    })
    if (!user) {
      throw new Error('用户不存在')
    }
    return toPublicUser(user)
  }

  isProviderEnabled(provider: OAuthProviderType, authConfig = this.configService.get<AuthConfig>('auth')) {
    const providerConfig = authConfig[provider]
    return Boolean(
      providerConfig.clientId?.trim()
      && providerConfig.clientSecret?.trim(),
    )
  }

  assertProviderEnabled(provider: OAuthProviderType) {
    if (!this.isProviderEnabled(provider)) {
      throw new NotFoundException(`${Provider[provider].title} 登录未启用`)
    }
  }

  async canActive(req: AuthRequest, provider: OAuthProviderType) {
    const path = req.path
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
      const state = random()
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
          redirect_uri: `${req.query.client}/api/oauth/${provider}/callback`,
        }
      }
      await this.oauthStore.setState(state, stateData)
      req.state = state
    }
  }

  async callbackHandler(req: AuthRequest, res: Response, provider: OAuthProviderType) {
    let bodyInfo = ''
    let msgInfo: any
    if (req.isBind) {
      if (!req.user) {
        throw new UnauthorizedException('用户未登录，无法绑定')
      }
      try {
        const userData = Provider[provider].normalizeProfile(req.thirdPartProfile)
        const providerId = (userData as unknown as Record<OAuthProviderType, string>)[provider]
        await this.bind(req.user, provider, providerId)
        if (req.oauthCallbackData) {
          const { state, redirect_uri } = req.oauthCallbackData
          return res.redirect(302, `${redirect_uri}?state=${state}`)
        }
        bodyInfo = '验证成功'
        msgInfo = {
          success: true,
        }
      }
      catch (err) {
        this.logger.debug('OAuth 账号绑定失败', {
          provider,
          userId: req.user.userId,
          error: err instanceof Error ? err.message : err,
        })
        bodyInfo = '绑定失败'
        msgInfo = {
          success: false,
        }
      }
    }
    // 登录
    else {
      bodyInfo = '登录完成'
      if (req.user || this.configService.get<AuthConfig>('auth').publicRegister) {
        if (!req.user) {
          // 用户不存在
          req.user = await this.register(provider, req.thirdPartProfile)
        }
        this.logger.audit('OAuth 登录成功', {
          provider,
          userId: req.user.userId,
          userName: req.user.userName,
        })
        if (req.oauthCallbackData) {
          const { state, redirect_uri } = req.oauthCallbackData
          const ticket = await this.codeStore.createCode(req.user.userId)
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
    }
    return this.renderPostMessagePage(bodyInfo, msgInfo)
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

  private renderPostMessagePage(bodyInfo: string, msgInfo: any) {
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

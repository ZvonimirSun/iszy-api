import type { Response } from 'express'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Device, PublicUser } from '@zvonimirsun/iszy-common'
import { AuthService } from '~domains/auth/auth.service'
import { UserService } from '~domains/user/user.service'
import {
  AppConfig,
  AuthConfig,
  AuthRequest,
  Logger,
  MinimalUser,
  ProviderType,
  random,
  StateData,
  toPublicUser,
} from '~shared'
import Provider from './providers'
import { CodeStore } from './store/code-store'
import { StateStore } from './store/state-store'

@Injectable()
export class OauthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly oauthStore: StateStore,
    private readonly codeStore: CodeStore,
  ) {}

  private readonly logger = new Logger(OauthService.name)

  async getCode(user: MinimalUser) {
    return this.codeStore.createCode(user.userId)
  }

  async getToken(user: MinimalUser, device: Device) {
    return this.authService.generateToken(user, device)
  }

  async unbind(user: MinimalUser, provider: ProviderType) {
    await this.userService.updateUser({
      userId: user.userId,
      [provider]: null,
    })
  }

  async bind(user: MinimalUser, provider: ProviderType, id: string) {
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

  async register(provider: ProviderType, profile: any) {
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
          this.logger.error(error.message)
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

  async validateUser(provider: ProviderType, id: string): Promise<PublicUser> {
    const user = await this.userService.find({
      [provider]: id,
    })
    if (!user) {
      throw new Error('用户不存在')
    }
    return toPublicUser(user)
  }

  async canActive(req: AuthRequest) {
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
          redirect_uri: `${req.query.client}/api/oauth/github/callback`,
        }
      }
      await this.oauthStore.setState(state, stateData)
      req.state = state
    }
  }

  async callbackHandler(req: AuthRequest, res: Response, provider: ProviderType) {
    let bodyInfo = ''
    let msgInfo: any
    if (req.isBind) {
      if (!req.user) {
        throw new UnauthorizedException('用户未登录，无法绑定')
      }
      try {
        const userData = Provider[provider].normalizeProfile(req.thirdPartProfile)
        await this.bind(req.user, provider, userData[provider])
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
        this.logger.log(`${req.user.userName}通过 ${Provider[provider].title} 登录成功`)
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

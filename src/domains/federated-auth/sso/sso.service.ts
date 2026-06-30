import type { Response } from 'express'
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PublicUser, UserStatus } from '@zvonimirsun/iszy-common'
import { AuthService } from '~domains/auth/auth.service'
import { CodeStore } from '~domains/auth/store/code-store'
import { UserService } from '~domains/user/user.service'
import {
  AppConfig,
  AuthRequest,
  AuthConfig,
  MinimalUser,
  random,
  StateData,
  toPublicUser,
} from '~shared'
import { OauthStateStore } from '../store/oauth-state-store'
import * as SsoProvider from './sso.provider'

@Injectable()
export class SsoService {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly stateStore: OauthStateStore,
    private readonly codeStore: CodeStore,
  ) {}

  async findLinkedUser(id: string, profile?: any): Promise<PublicUser | null> {
    const user = await this.userService.find({ sso: id })
    if (!user) {
      return null
    }
    await this.syncAdminRole(user.userId, profile)
    return toPublicUser(user)
  }

  async validateUser(id: string, profile?: any): Promise<PublicUser> {
    const user = await this.findLinkedUser(id, profile)
    if (!user) {
      throw new Error('用户不存在')
    }
    return user
  }

  isEnabled() {
    const ssoConfig = this.configService.get<AuthConfig>('auth').sso
    return Boolean(
      ssoConfig.origin?.trim()
      && ssoConfig.clientId?.trim()
      && ssoConfig.clientSecret?.trim(),
    )
  }

  assertEnabled() {
    if (!this.isEnabled()) {
      throw new NotFoundException('SSO 登录未启用')
    }
  }

  async canActive(req: AuthRequest) {
    const path = req.path
    if (path.endsWith('/callback')) {
      const { state } = req.query
      if (typeof state !== 'string') {
        throw new UnauthorizedException('缺少 state 参数')
      }
      const stateData = await this.stateStore.getState(state)
      if (!stateData) {
        throw new UnauthorizedException('无效的 state 参数')
      }
      req.isBind = !!stateData.user
      if (req.isBind) {
        req.user = stateData.user
      }
      req.oauthCallbackData = stateData.callbackData
      await this.stateStore.removeState(state)
      return
    }

    const state = random()
    const stateData: StateData = path.endsWith('/bind')
      ? {
          user: req.user,
        }
      : {}
    const origin = req.query.client as string | undefined
    if (!this.isAllowedOrigin(origin)) {
      throw new UnauthorizedException('不允许的来源')
    }
    else if (req.query.state && origin) {
      stateData.callbackData = {
        state: req.query.state as string,
        redirect_uri: `${req.query.client}/api/oauth/sso/callback`,
      }
    }
    await this.stateStore.setState(state, stateData)
    req.state = state
  }

  async callbackHandler(req: AuthRequest, res: Response) {
    const profile = req.thirdPartProfile
    const userData = SsoProvider.normalizeProfile(profile)
    if (req.isBind) {
      if (!req.user) {
        throw new UnauthorizedException('用户未登录，无法绑定')
      }
      try {
        await this.bind(req.user, userData.sso, profile)
        if (req.oauthCallbackData) {
          const { state, redirect_uri } = req.oauthCallbackData
          return res.redirect(302, `${redirect_uri}?state=${state}`)
        }
        return this.renderPostMessagePage('验证成功', {
          success: true,
        })
      }
      catch {
        if (req.oauthCallbackData) {
          const { state, redirect_uri } = req.oauthCallbackData
          return res.redirect(302, `${redirect_uri}?state=${state}&error=绑定失败`)
        }
        return this.renderPostMessagePage('绑定失败', {
          success: false,
        })
      }
    }

    if (req.user?.userId) {
      const ticket = await this.codeStore.createCode(req.user.userId)
      if (req.oauthCallbackData) {
        const { state, redirect_uri } = req.oauthCallbackData
        return res.redirect(302, `${redirect_uri}?state=${state}&code=${ticket}`)
      }
      return this.renderPostMessagePage('登录完成', {
        type: 'oauth_complete',
        data: await this.authService.generateToken(req.user, req.device),
      })
    }

    const sameNameUser = await this.userService.findOne(userData.userName)
    if (sameNameUser) {
      const message = '用户名已存在'
      if (req.oauthCallbackData) {
        const { state, redirect_uri } = req.oauthCallbackData
        const query = new URLSearchParams({
          state,
          error: message,
        })
        return res.redirect(302, `${redirect_uri}?${query.toString()}`)
      }
      return this.renderPostMessagePage('登录失败', {
        type: 'oauth_fail',
        data: message,
      })
    }

    const newUser = await this.createSsoUser(profile)
    const ticket = await this.codeStore.createCode(newUser.userId)
    if (req.oauthCallbackData) {
      const { state, redirect_uri } = req.oauthCallbackData
      return res.redirect(302, `${redirect_uri}?state=${state}&code=${ticket}`)
    }
    return this.renderPostMessagePage('登录完成', {
      type: 'oauth_complete',
      data: await this.authService.generateToken(newUser, req.device),
    })
  }

  private async createSsoUser(profile: any) {
    const userData = SsoProvider.normalizeProfile(profile)
    const testUser = await this.userService.findOne(userData.userName)
    if (testUser) {
      throw new Error('用户名已存在')
    }
    const createUser = userData as unknown as Parameters<UserService['create']>[0]
    createUser.status = UserStatus.ENABLED
    const user = await this.userService.create(createUser)
    await this.syncAdminRole(user.userId, profile)
    return user
  }

  private async bind(user: MinimalUser, id: string, profile?: any) {
    const tmpUser = await this.userService.find({
      sso: id,
    })
    if (tmpUser) {
      throw new Error('SSO 用户已被占用')
    }
    await this.userService.updateUser({
      userId: user.userId,
      sso: id,
    })
    await this.syncAdminRole(user.userId, profile)
  }

  private async syncAdminRole(userId: number, profile?: any) {
    if (!this.hasAdminRole(profile)) {
      return
    }
    await this.userService.ensureUserRoleByName(userId, 'admin')
  }

  private hasAdminRole(profile?: any) {
    if (!profile) {
      return false
    }
    const claims = [
      profile.roles,
      profile.groups,
      profile.role,
      profile.authorities,
    ]
    return claims
      .flatMap(claim => Array.isArray(claim) ? claim : [claim])
      .filter(Boolean)
      .some((role) => {
        if (typeof role === 'string') {
          return role.toLowerCase() === 'admin'
        }
        if (typeof role === 'object' && typeof role.name === 'string') {
          return role.name.toLowerCase() === 'admin'
        }
        return false
      })
  }

  private isAllowedOrigin(requestOrigin?: string) {
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

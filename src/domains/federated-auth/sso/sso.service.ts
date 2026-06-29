import type { Response } from 'express'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PublicUser, UserStatus } from '@zvonimirsun/iszy-common'
import { AuthService } from '~domains/auth/auth.service'
import { CodeStore } from '~domains/auth/store/code-store'
import { UserService } from '~domains/user/user.service'
import {
  AppConfig,
  AuthRequest,
  Logger,
  random,
  StateData,
  toPublicUser,
} from '~shared'
import { OauthStateStore } from '../store/oauth-state-store'
import { SsoResolveDto } from './dto/sso-resolve.dto'
import { SsoBindStore } from './sso-bind.store'
import * as SsoProvider from './sso.provider'

@Injectable()
export class SsoService {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly stateStore: OauthStateStore,
    private readonly codeStore: CodeStore,
    private readonly ssoBindStore: SsoBindStore,
  ) {}

  private readonly logger = new Logger(SsoService.name)

  async validateUser(id: string, profile?: any): Promise<PublicUser> {
    const user = await this.userService.find({ sso: id })
    if (!user) {
      throw new Error('用户不存在')
    }
    await this.syncAdminRole(user.userId, profile)
    return toPublicUser(user)
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
      req.oauthCallbackData = stateData.callbackData
      await this.stateStore.removeState(state)
      return
    }

    const state = random()
    const stateData: StateData = {}
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
    const sameNameUser = await this.userService.findOne(userData.userName)
    if (sameNameUser && !sameNameUser.sso) {
      const bindToken = await this.ssoBindStore.create({
        providerId: userData.sso,
        ssoUserName: userData.userName,
        ssoNickName: userData.nickName,
        ssoEmail: userData.email,
        ssoAdmin: this.hasAdminRole(profile),
        userId: sameNameUser.userId,
        userName: sameNameUser.userName,
        nickName: sameNameUser.nickName,
        email: sameNameUser.email,
      })
      if (req.oauthCallbackData) {
        const { state, redirect_uri } = req.oauthCallbackData
        const query = new URLSearchParams({
          state,
          bind_token: bindToken,
          user_name: sameNameUser.userName,
          nick_name: sameNameUser.nickName,
        })
        return res.redirect(302, `${redirect_uri}?${query.toString()}`)
      }
      return this.renderPostMessagePage('需要绑定已有账户', {
        type: 'sso_bind_required',
        bindToken,
        userName: sameNameUser.userName,
        nickName: sameNameUser.nickName,
      })
    }

    const newUser = await this.createSsoUser(profile, sameNameUser?.sso ? random(4) : '')
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

  async resolve(dto: SsoResolveDto) {
    if (!['bind', 'create'].includes(dto.action)) {
      throw new Error('不支持的处理方式')
    }
    const bindData = await this.ssoBindStore.get(dto.bindToken)
    if (!bindData) {
      throw new Error('绑定票据已失效')
    }

    if (dto.action === 'bind') {
      if (!dto.password) {
        throw new Error('请输入密码')
      }
      const user = await this.userService.findOne(bindData.userId)
      if (!user || user.sso) {
        throw new Error('账户状态已变化，请重新登录')
      }
      const passed = await this.userService.checkUser(user, dto.password)
      if (!passed) {
        throw new Error('密码错误')
      }
      await this.userService.updateUser({
        userId: user.userId,
        sso: bindData.providerId,
      })
      if (bindData.ssoAdmin) {
        await this.userService.ensureUserRoleByName(user.userId, 'admin')
      }
      await this.ssoBindStore.remove(dto.bindToken)
      return this.codeStore.createCode(user.userId)
    }

    const profile = {
      sub: bindData.providerId,
      preferred_username: bindData.ssoUserName,
      name: bindData.ssoNickName,
      email: bindData.ssoEmail,
      roles: bindData.ssoAdmin ? ['admin'] : [],
    }
    const newUser = await this.createSsoUser(profile, random(4))
    await this.ssoBindStore.remove(dto.bindToken)
    return this.codeStore.createCode(newUser.userId)
  }

  private async createSsoUser(profile: any, userNameSuffix = '') {
    const userData = SsoProvider.normalizeProfile(profile)
    if (userNameSuffix) {
      userData.userName = `${userData.userName}_${userNameSuffix}`
    }
    const testUser = await this.userService.findOne(userData.userName)
    if (testUser) {
      userData.userName = `${userData.userName}_${random(4)}`
    }
    const createUser = userData as unknown as Parameters<UserService['create']>[0]
    createUser.status = UserStatus.ENABLED
    const user = await this.userService.create(createUser)
    await this.syncAdminRole(user.userId, profile)
    return user
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

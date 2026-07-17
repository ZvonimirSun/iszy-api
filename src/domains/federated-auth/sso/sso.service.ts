import type { Response } from 'express'
import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PublicUser, RawUser, UserStatus } from '@zvonimirsun/iszy-common'
import { AuthService } from '~domains/auth/auth.service'
import { CodeStore } from '~domains/auth/store/code-store'
import { generateDevice } from '~domains/auth/utils/generateDevice'
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
import type {
  SsoBindCompletionDto,
  SsoCreateCompletionDto,
} from './dto/sso-completion.dto'
import * as SsoProvider from './sso.provider'
import { SsoCompletionStore } from './store/sso-completion-store'

@Injectable()
export class SsoService {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly stateStore: OauthStateStore,
    private readonly codeStore: CodeStore,
    private readonly completionStore: SsoCompletionStore,
  ) {}

  async findLinkedUser(id: string, profile?: any): Promise<PublicUser | null> {
    const user = await this.userService.find({ sso: id })
    if (!user) {
      return null
    }
    const syncedUser = await this.syncSsoProfile(user, profile)
    await this.syncAdminRole(syncedUser.userId, profile)
    return toPublicUser(syncedUser)
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

    const pendingToken = await this.completionStore.create({
      ssoId: userData.sso,
      suggestedUserName: userData.userName,
      nickName: userData.nickName,
      email: userData.email,
      grantAdmin: this.hasAdminRole(profile),
    })
    if (req.oauthCallbackData) {
      const { state, redirect_uri } = req.oauthCallbackData
      const query = new URLSearchParams({
        state,
        pending_token: pendingToken,
      })
      return res.redirect(302, `${redirect_uri}?${query.toString()}`)
    }
    await this.completionStore.remove(pendingToken)
    throw new BadRequestException('缺少客户端回调信息，无法完成 SSO 账户关联')
  }

  async getCompletion(pendingToken: string) {
    const data = await this.completionStore.getOrThrow(pendingToken)
    return {
      provider: 'sso' as const,
      providerTitle: this.configService.get<AuthConfig>('auth').sso.title || 'SSO统一登录',
      suggestedUserName: data.suggestedUserName,
      nickName: data.nickName,
      email: data.email,
    }
  }

  async completeBind(req: AuthRequest, completionDto: SsoBindCompletionDto) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('用户名或密码错误')
    }

    return this.completionStore.consume(completionDto.pendingToken, async (completion) => {
      await this.assertSsoSubjectAvailable(completionDto.pendingToken, completion.ssoId)

      const targetUser = await this.userService.findOne(req.user.userId)
      if (targetUser.sso) {
        throw new ConflictException('该账户已绑定其他 SSO 账户')
      }

      let user: RawUser | null
      try {
        user = await this.userService.bindSsoIfUnbound(
          targetUser.userId,
          completion.ssoId,
          completionDto.useSsoNickname ? completion.nickName : undefined,
        )
      }
      catch (error) {
        if (this.getUniqueConstraintPath(error) === 'sso') {
          await this.invalidateCompletedFlow(completionDto.pendingToken)
        }
        throw error
      }

      if (!user) {
        const linkedUser = await this.userService.find({ sso: completion.ssoId })
        if (linkedUser) {
          await this.invalidateCompletedFlow(completionDto.pendingToken)
        }
        throw new ConflictException('该账户已绑定其他 SSO 账户')
      }

      await this.syncAdminRoleByFlag(user.userId, completion.grantAdmin)
      return this.authService.generateToken(user, req.device || generateDevice(req))
    })
  }

  async completeCreate(req: AuthRequest, completionDto: SsoCreateCompletionDto) {
    const registerUser = {
      userName: completionDto.userName,
      nickName: completionDto.nickName,
      email: completionDto.email,
      passwd: completionDto.passwd,
    }
    try {
      this.userService.normalizeUserInfo(registerUser)
    }
    catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : '用户信息非法')
    }

    return this.completionStore.consume(completionDto.pendingToken, async (completion) => {
      await this.assertSsoSubjectAvailable(completionDto.pendingToken, completion.ssoId)

      let user: RawUser
      try {
        user = await this.userService.create({
          userName: registerUser.userName,
          nickName: registerUser.nickName,
          email: registerUser.email || undefined,
          passwd: await this.authService.hashPassword(registerUser.passwd),
          sso: completion.ssoId,
          status: UserStatus.ENABLED,
        })
      }
      catch (error) {
        const path = this.getUniqueConstraintPath(error)
        if (path === 'sso') {
          await this.invalidateCompletedFlow(completionDto.pendingToken)
        }
        if (path === 'userName') {
          throw new ConflictException('用户名已存在')
        }
        if (path === 'email') {
          throw new ConflictException('邮箱已被绑定')
        }
        if (path) {
          throw new ConflictException('用户信息已被占用')
        }
        throw error
      }

      await this.syncAdminRoleByFlag(user.userId, completion.grantAdmin)
      return this.authService.generateToken(user, generateDevice(req))
    })
  }

  private async bind(user: MinimalUser, id: string, profile?: any) {
    const tmpUser = await this.userService.find({
      sso: id,
    })
    if (tmpUser) {
      throw new Error('SSO 用户已被占用')
    }
    const currentUser = await this.userService.findOne(user.userId)
    if (currentUser.sso) {
      throw new Error('该账户已绑定其他 SSO 账户')
    }
    const boundUser = await this.userService.bindSsoIfUnbound(user.userId, id)
    if (!boundUser) {
      throw new Error('该账户已绑定其他 SSO 账户')
    }
    await this.syncAdminRole(user.userId, profile)
  }

  private async assertSsoSubjectAvailable(pendingToken: string, ssoId: string) {
    const linkedUser = await this.userService.find({ sso: ssoId })
    if (linkedUser) {
      await this.invalidateCompletedFlow(pendingToken)
    }
  }

  private async invalidateCompletedFlow(pendingToken: string): Promise<never> {
    await this.completionStore.remove(pendingToken)
    throw new GoneException('SSO 登录流程已完成，请重新登录')
  }

  private getUniqueConstraintPath(error: unknown) {
    if (!error || typeof error !== 'object' || !('name' in error)) {
      return undefined
    }
    if ((error as { name?: string }).name !== 'SequelizeUniqueConstraintError') {
      return undefined
    }
    const errors = (error as { errors?: Array<{ path?: string }> }).errors
    return errors?.[0]?.path
  }

  private async syncSsoProfile(user: RawUser, profile?: any) {
    if (!profile) {
      return user
    }
    const userData = SsoProvider.normalizeProfile(profile)
    const updateUser: Partial<RawUser> = {
      userId: user.userId,
    }

    if (!user.nickName && userData.nickName) {
      updateUser.nickName = userData.nickName
    }
    if (!user.email && userData.email) {
      updateUser.email = userData.email
    }
    if (!updateUser.nickName && !updateUser.email) {
      return user
    }
    return this.userService.updateUser(updateUser)
  }

  private async syncAdminRole(userId: number, profile?: any) {
    await this.syncAdminRoleByFlag(userId, this.hasAdminRole(profile))
  }

  private async syncAdminRoleByFlag(userId: number, grantAdmin: boolean) {
    if (!grantAdmin) {
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

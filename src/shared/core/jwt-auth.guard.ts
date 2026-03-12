import { ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { GUARDS_METADATA } from '@nestjs/common/constants'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { generateDevice } from '~domains/auth/utils/generateDevice'
import { CodeStore } from '~domains/oauth/store/code-store'
import { Role } from '~domains/user/entities'
import { UserService } from '~domains/user/user.service'
import { AuthRequest, MetaKeysEnum, toMinimalUser } from '~/shared'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector, private userService: UserService, private codeStore: CodeStore) {
    super()
  }

  async canActivate(context: ExecutionContext) {
    const getMetaValue = <T>(key: string): T => {
      return this.reflector.getAllAndOverride<T>(key, [
        context.getHandler(),
        context.getClass(),
      ])
    }

    const req: AuthRequest = context.switchToHttp().getRequest()

    const isPublic = getMetaValue<boolean>(MetaKeysEnum.IS_PUBLIC_KEY)
    const isPrivate = getMetaValue<boolean>(MetaKeysEnum.IS_PRIVATE_KEY)
    // 私有设置优先级高于公共设置
    if (isPublic && !isPrivate)
      return true

    // 部分AuthGuard跳过全局验证
    const bypassAuthGuards = ['LocalAuthGuard']
    const allGuards = getMetaValue<any[]>(GUARDS_METADATA) || []
    for (const guard of allGuards) {
      if (bypassAuthGuards.includes(guard.name))
        return true
    }

    const ticketOnly = getMetaValue<boolean>(MetaKeysEnum.TICKET_ONLY_KEY)
    if (ticketOnly) {
      await this.checkTicket(req)
    }
    else {
      try {
        // jwt验证
        await super.canActivate(context)
      }
      catch (e) {
        await this.checkTicket(req)
      }
    }

    const useRefreshToken = getMetaValue<boolean>(MetaKeysEnum.USE_REFRESH_TOKEN_KEY)
    if (useRefreshToken) {
      if (!req.isRefresh) {
        throw new ForbiddenException('仅支持使用刷新令牌访问')
      }
    }

    const { user } = req

    if (!user)
      throw new ForbiddenException('未找到用户信息')

    // 角色验证
    const requiredRoles = getMetaValue<string[]>(MetaKeysEnum.ROLES_KEY)

    if (!requiredRoles || !requiredRoles.length)
      return true

    const rawUser = await this.userService.findOne(user.userId)

    const haveRole = requiredRoles.some(role => rawUser.roles?.map((item: Role) => {
      return item.name
    }).includes(role))

    if (!haveRole) {
      throw new ForbiddenException('权限不足')
    }
    return true
  }

  async checkTicket(req: AuthRequest) {
    const ticket = req.query.access_token as string | undefined
    if (!ticket) {
      throw new UnauthorizedException('未找到访问令牌')
    }
    const ticketUserId = await this.codeStore.checkCode(ticket)
    if (ticketUserId == null) {
      throw new UnauthorizedException('访问令牌无效')
    }
    req.user = toMinimalUser(await this.userService.findOne(ticketUserId))
    req.device = generateDevice(req)
  }
}

import { ExecutionContext, Injectable } from '@nestjs/common'
import { GUARDS_METADATA } from '@nestjs/common/constants'
import { Reflector } from '@nestjs/core'
import { AuthGuard as DefaultAuthGuard } from '@nestjs/passport'
import { MetaKeysEnum } from '~core/enum/metaKeys.enum'
import { Role } from '~entities/user'
import { AuthRequest } from '~types/AuthRequest'

@Injectable()
export class JwtAuthGuard extends DefaultAuthGuard('jwt') {
  constructor(private reflector: Reflector) {
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

    // jwt验证
    let activeError: Error
    try {
      await super.canActivate(context)
    }
    catch (e) {
      activeError = e
    }

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

    if (activeError)
      throw activeError

    const useRefreshToken = getMetaValue<boolean>(MetaKeysEnum.USE_REFRESH_TOKEN_KEY)
    if (useRefreshToken)
      return Boolean(req.isRefresh)

    const { user } = req

    if (!user)
      return false

    // 角色验证
    const requiredRoles = getMetaValue<string[]>(MetaKeysEnum.ROLES_KEY)

    if (!requiredRoles || !requiredRoles.length)
      return true

    return requiredRoles.some(role => user.roles?.map((item: Role) => {
      return item.name
    }).includes(role))
  }
}

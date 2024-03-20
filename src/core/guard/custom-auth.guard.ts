import { AuthGuard as DefaultAuthGuard } from '@nestjs/passport'
import { ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { MetaKeysEnum } from '~core/enum/metaKeys.enum'
import { Role } from '~entities/user/role.model'

@Injectable()
export class AuthGuard extends DefaultAuthGuard('custom') {
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

    const isPublic = getMetaValue<boolean>(MetaKeysEnum.IS_PUBLIC_KEY)
    if (isPublic)
      return true

    const canActivate = (await super.canActivate(context)) as boolean

    if (!canActivate)
      return false

    const requiredRoles = getMetaValue<string[]>(MetaKeysEnum.ROLES_KEY)

    const { user } = context.switchToHttp().getRequest()
    if (!user)
      return false

    if (!requiredRoles || !requiredRoles.length)
      return true

    return requiredRoles.some(role => user.roles?.map((item: Role) => {
      return item.name
    }).includes(role))
  }
}

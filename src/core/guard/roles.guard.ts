import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '~core/decorator/roles.decorator'
import { RoleEnum } from '~core/enum/role.enum'
import { Role } from '~entities/user/role.model'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest()
    if (!user)
      return false

    const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles || !requiredRoles.length)
      return true

    return requiredRoles.some(role => user.roles?.map((item: Role) => {
      return item.name
    }).includes(role))
  }
}

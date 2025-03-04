import { SetMetadata } from '@nestjs/common'
import { MetaKeysEnum } from '~core/enum/metaKeys.enum'
import { RoleEnum } from '../enum/role.enum'

export const Roles = (...roles: RoleEnum[]) => SetMetadata(MetaKeysEnum.ROLES_KEY, roles)

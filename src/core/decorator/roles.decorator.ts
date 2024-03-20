import { SetMetadata } from '@nestjs/common'
import { RoleEnum } from '../enum/role.enum'
import { MetaKeysEnum } from '~core/enum/metaKeys.enum'

export const Roles = (...roles: RoleEnum[]) => SetMetadata(MetaKeysEnum.ROLES_KEY, roles)

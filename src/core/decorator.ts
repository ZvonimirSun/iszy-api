import { SetMetadata } from '@nestjs/common'
import { MetaKeysEnum } from '~core/enum/metaKeys.enum'
import { RoleEnum } from './enum/role.enum'

export const Roles = (...roles: RoleEnum[]) => SetMetadata(MetaKeysEnum.ROLES_KEY, roles)
export const Private = () => SetMetadata(MetaKeysEnum.IS_PRIVATE_KEY, true)
export const Public = () => SetMetadata(MetaKeysEnum.IS_PUBLIC_KEY, true)
export const RefreshToken = () => SetMetadata(MetaKeysEnum.USE_REFRESH_TOKEN_KEY, true)

import { SetMetadata } from '@nestjs/common'
import { RoleEnum } from '@zvonimirsun/iszy-common'
import { MetaKeysEnum } from '~shared'

export const Roles = (...roles: RoleEnum[]) => SetMetadata(MetaKeysEnum.ROLES_KEY, roles)
export const Private = () => SetMetadata(MetaKeysEnum.IS_PRIVATE_KEY, true)
export const Public = () => SetMetadata(MetaKeysEnum.IS_PUBLIC_KEY, true)
export const RefreshToken = () => SetMetadata(MetaKeysEnum.USE_REFRESH_TOKEN_KEY, true)

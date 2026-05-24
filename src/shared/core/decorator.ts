import { SetMetadata } from '@nestjs/common'
import { RoleEnum } from '@zvonimirsun/iszy-common'
import { MetaKeysEnum } from '~shared'

export const Roles = (...roles: RoleEnum[]) => SetMetadata(MetaKeysEnum.ROLES_KEY, roles)
// Privilege strings map to Privilege.type values derived from the user's effective roles.
export const Privileges = (...privileges: string[]) => SetMetadata(MetaKeysEnum.PRIVILEGES_KEY, privileges)
export const Private = () => SetMetadata(MetaKeysEnum.IS_PRIVATE_KEY, true)
export const Public = () => SetMetadata(MetaKeysEnum.IS_PUBLIC_KEY, true)
export const RefreshToken = () => SetMetadata(MetaKeysEnum.USE_REFRESH_TOKEN_KEY, true)
export const TicketOnly = () => SetMetadata(MetaKeysEnum.TICKET_ONLY_KEY, true)

import { Optional, PublicUser, RawUser } from '@zvonimirsun/iszy-common'
import { MinimalUser } from '~types/user'

export function toPublicUser(user: Optional<RawUser, 'passwd' | 'passwdSalt'>): PublicUser {
  const { passwd, passwdSalt, ...result } = user
  return result
}

export function toMinimalUser(user: MinimalUser): MinimalUser {
  const { userId, userName, nickName } = user
  return { userId, userName, nickName }
}

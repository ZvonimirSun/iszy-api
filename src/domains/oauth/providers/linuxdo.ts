import { PublicUser } from '@zvonimirsun/iszy-common'
import { OptionalExcept } from '@zvonimirsun/iszy-common/dist/types/common'

const title = 'LINUX DO'

export function normalizeProfile(profile: any): OptionalExcept<PublicUser, 'userName' | 'nickName' | 'email'> {
  return {
    userName: profile.username,
    nickName: profile.name,
    email: profile.email,
    linuxdo: profile.id,
  }
}

export {
  title,
}

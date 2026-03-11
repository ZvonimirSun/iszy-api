import { PublicUser } from '@zvonimirsun/iszy-common'
import { OptionalExcept } from '@zvonimirsun/iszy-common/dist/types/common'

const title = 'GitHub'

export function normalizeProfile(profile: any): OptionalExcept<PublicUser, 'userName' | 'nickName' | 'email'> {
  return {
    userName: profile.username,
    nickName: profile.displayName,
    email: profile.emails[0].value,
    github: profile.id,
  }
}

export {
  title,
}

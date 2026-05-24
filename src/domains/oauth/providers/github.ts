import { OptionalExcept, PublicUser } from '@zvonimirsun/iszy-common'

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

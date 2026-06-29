import { OptionalExcept, PublicUser } from '@zvonimirsun/iszy-common'

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

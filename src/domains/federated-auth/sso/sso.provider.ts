import type { OptionalExcept, PublicUser } from '@zvonimirsun/iszy-common'

const title = 'SSO'

export function normalizeProfile(profile: any): OptionalExcept<PublicUser, 'userName' | 'nickName' | 'email'> & { sso: string } {
  const id = profile.sub?.toString() ?? profile.id?.toString()
  if (!id) {
    throw new Error('SSO profile missing subject')
  }
  const userName = (profile.preferred_username ?? profile.username ?? profile.email ?? id).toString().trim().toLowerCase()
  const nickName = (profile.name ?? userName).toString().trim()
  const email = profile.email?.toString().trim().toLowerCase()

  return {
    userName,
    nickName,
    email,
    sso: id,
  }
}

export {
  title,
}

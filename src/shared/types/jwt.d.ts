import { MinimalUser } from '~types/user'

export interface JWTPayload {
  deviceId: string
  profile: MinimalUser
}

export interface RefreshJWTPayload {
  deviceId: string
  refreshUserId: MinimalUser['userId']
}

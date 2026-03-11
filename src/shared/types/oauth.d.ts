import type { Request } from 'express'
import { Device, RawUser } from '@zvonimirsun/iszy-common'
import { MinimalUser } from '~shared'

export interface OauthCallbackData {
  state: string
  redirect_uri: string
}

export interface StateData {
  user?: MinimalUser
  callbackData?: OauthCallbackData
}
export interface AuthRequest extends Request {
  user?: MinimalUser
  oauthCallbackData?: OauthCallbackData

  device?: Device
  isRefresh?: boolean

  state?: string
  isBind?: boolean
  thirdPartProfile?: any
}

export interface OauthProvider {
  bind: (user: MinimalUser, profile: any) => Promise<{ type: string, data?: any }>
  register: (profile: any) => Promise<RawUser>
}

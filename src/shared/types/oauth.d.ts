import type { Device } from '@zvonimirsun/iszy-common'
import type { Request } from 'express'
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

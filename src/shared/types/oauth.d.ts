import type { Request } from 'express'
import { Device } from '@zvonimirsun/iszy-common'
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

export type OAuthProviderType = 'github' | 'linuxdo'
export type ProviderType = OAuthProviderType | 'sso'

export interface SsoBindData {
  providerId: string
  ssoUserName: string
  ssoNickName: string
  ssoEmail?: string
  ssoAdmin?: boolean
  userId: number
  userName: string
  nickName: string
  email?: string
}

import type { Device } from '@zvonimirsun/iszy-common'
import type { Request } from 'express'
import { MinimalUser } from '~shared'

export interface StateData {
  user?: MinimalUser
}
export interface AuthRequest extends Request {
  user?: MinimalUser
  device?: Device
  isRefresh?: boolean

  state?: string
  isBind?: boolean
  thirdPartProfile?: any
}

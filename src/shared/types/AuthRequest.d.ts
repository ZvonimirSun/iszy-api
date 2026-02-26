import type { Device } from '@zvonimirsun/iszy-common'
import type { Request } from 'express'
import type { Session } from 'express-session'
import { MinimalUser } from '~shared'

export interface AuthSession extends Session {
  bindGithub?: boolean
  bindLinuxdo?: boolean
}

export interface AuthRequest extends Request {
  user?: MinimalUser
  device?: Device
  isRefresh?: boolean

  state?: string
  isBind?: boolean
  thirdPartProfile?: any
}

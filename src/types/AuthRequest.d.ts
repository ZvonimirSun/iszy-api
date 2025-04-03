import type { Device } from '@zvonimirsun/iszy-common'
import type { Request } from 'express'
import type { Session } from 'express-session'
import type { PublicUser } from '~entities/user/user.model'

interface AuthSession extends Session {
  bindGithub?: boolean
  bindLinuxdo?: boolean
}

export interface AuthRequest extends Request {
  user?: PublicUser
  device?: Device
  isRefresh?: boolean

  session?: AuthSession
  thirdPartProfile?: any
}

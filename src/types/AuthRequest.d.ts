import type { Request } from 'express'
import type { PublicUser } from '~entities/user/user.model'

interface AuthSession extends Session {
  bindGithub?: boolean
}

export interface AuthRequest extends Request {
  user?: PublicUser
  deviceId?: string
  isRefresh?: boolean

  session?: AuthSession
  thirdPartProfile?: any
}

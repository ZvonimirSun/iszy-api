import type { Request } from 'express'
import type { PublicUser } from '~entities/user/user.model'

export interface AuthRequest extends Request {
  user?: PublicUser
  deviceId?: string
  isRefresh?: boolean
}

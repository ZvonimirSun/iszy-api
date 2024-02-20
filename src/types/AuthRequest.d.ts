import type { Request } from 'express'
import type { Session } from 'express-session'
import type { User } from '../../modules/user/entities/user.model'

interface CallbackFunc {
  (err?): any
}

interface LogInFunc {
  (user?: Partial<User>, options?: any, done?: CallbackFunc): void
}

interface LogOutFunc {
  (options?: any, done?: CallbackFunc): void
}

interface AuthSession extends Session {
  passport?: {
    user?: Partial<User>
  }
}

export interface AuthRequest extends Request {
  user?: Partial<User>

  login?: LogInFunc

  logIn?: LogInFunc

  logout?: LogOutFunc

  logOut?: LogOutFunc

  isAuthenticated?: {
    (): boolean
  }

  isUnauthenticated?: {
    (): boolean
  }

  session?: AuthSession
}

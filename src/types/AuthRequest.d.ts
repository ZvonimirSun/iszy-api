import type { Request } from 'express'
import type { Session } from 'express-session'
import type { PublicUser } from '~entities/user/user.model'
import { LoginDto } from '~modules/auth/dto/login.dto'

interface CallbackFunc {
  (err?): any
}

interface LogInFunc {
  (user?: Partial<LoginDto>, options?: any, done?: CallbackFunc): void
}

interface LogOutFunc {
  (options?: any, done?: CallbackFunc): void
}

interface AuthSession extends Session {
  passport?: {
    user?: PublicUser
  }
}

export interface AuthRequest extends Request {
  user?: PublicUser

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

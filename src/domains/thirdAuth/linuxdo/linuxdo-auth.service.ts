import { Injectable, Logger } from '@nestjs/common'
import { Device, encodeUUID, PublicUser, UserStatus } from '@zvonimirsun/iszy-common'
import { AuthService } from '~domains/auth/auth.service'
import { UserService } from '~domains/user/user.service'
import { MinimalUser } from '~types/user'

@Injectable()
export class LinuxdoAuthService {
  constructor(
    private readonly userService: UserService,
    private authService: AuthService,
  ) {}

  private readonly logger = new Logger(LinuxdoAuthService.name)

  async validateUser(profile: any): Promise<PublicUser> {
    const user = await this.userService.find({
      linuxdo: profile.id,
    })
    if (!user) {
      throw new Error('用户不存在')
    }
    const { passwd, passwdSalt, ...result } = user
    return result
  }

  async login(user: MinimalUser, device: Device) {
    const data = await this.authService.generateToken(user, device)
    return {
      type: 'oauth_complete',
      data,
    }
  }

  async register(profile: any) {
    try {
      let userName = profile.username
      const testUser = await this.userService.findOne(userName)
      if (testUser) {
        userName = `${userName}_${encodeUUID()}`
      }
      return await this.userService.create({
        userName,
        nickName: profile.name,
        email: profile.email,
        status: UserStatus.ENABLED,
        linuxdo: profile.id,
      })
    }
    catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        const error = e.errors[0]
        if (error) {
          this.logger.error(error.message)
          switch (error.path) {
            case 'email': {
              throw new Error('邮箱已被绑定')
            }
            case 'linuxdo': {
              throw new Error('LINUX DO 账号已被绑定')
            }
            default: {
              throw new Error(error.message)
            }
          }
        }
        else {
          throw new Error(e.name)
        }
      }
      else {
        throw new Error(e.name)
      }
    }
  }

  async bind(profile: any) {
    const tmpUser = await this.userService.find({
      linuxdo: profile.id,
    })
    if (tmpUser) {
      return {
        type: 'bind_fail',
        data: 'LINUX DO 用户已被占用',
      }
    }
    else {
      return {
        type: 'bind_success',
        data: profile.id,
      }
    }
  }
}

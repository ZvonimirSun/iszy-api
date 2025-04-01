import { Injectable, Logger } from '@nestjs/common'
import { PublicUser } from '~entities/user'
import { AuthService } from '~modules/core/auth/auth.service'
import { UserService } from '~modules/core/user/user.service'
import { encodeUUID } from '~utils/uuid'

@Injectable()
export class GithubAuthService {
  constructor(
    private readonly userService: UserService,
    private authService: AuthService,
  ) {}

  private readonly logger = new Logger(GithubAuthService.name)

  async validateUser(githubProfile: any): Promise<PublicUser> {
    const user = await this.userService.find({
      github: githubProfile.id,
    })
    if (!user) {
      throw new Error('用户不存在')
    }
    const { passwd, passwdSalt, ...result } = user
    return result
  }

  async login(user?: PublicUser, deviceId?: string) {
    const data = await this.authService.generateToken(user, deviceId)
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
        nickName: profile.displayName,
        email: profile.emails[0].value,
        status: profile.ENABLED,
        github: profile.id,
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
            case 'github': {
              throw new Error('Github账号已被绑定')
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
      github: profile.id,
    })
    if (tmpUser) {
      return {
        type: 'bind_fail',
        data: 'Github用户已被占用',
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

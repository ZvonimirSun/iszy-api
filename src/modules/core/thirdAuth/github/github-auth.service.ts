import { Injectable, Logger } from '@nestjs/common'
import { PublicUser } from '~entities/user'
import { AuthService } from '~modules/core/auth/auth.service'
import { UserService } from '~modules/core/user/user.service'

@Injectable()
export class GithubAuthService {
  constructor(
    private readonly userService: UserService,
    private authService: AuthService,
  ) {}

  private readonly logger = new Logger(GithubAuthService.name)

  async validateUser(githubProfile: any): Promise<PublicUser> {
    const user = await this.userService.findOneByGithub(githubProfile.id)
    if (!user) {
      throw new Error('用户不存在')
    }
    const { passwd, passwdSalt, ...result } = user
    return result
  }

  async isNotBind(githubId: string) {
    return !(await this.userService.findOneByGithub(githubId))
  }

  async login(user: PublicUser, deviceId?: string) {
    const data = await this.authService.generateToken(user, deviceId)
    return {
      type: 'oauth_complete',
      data,
    }
  }

  async bind(profile: any) {
    const tmpUser = await this.userService.findOneByGithub(profile.id)
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

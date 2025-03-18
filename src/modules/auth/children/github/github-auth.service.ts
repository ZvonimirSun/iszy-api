import { Injectable, Logger } from '@nestjs/common'
import { PublicUser } from '~entities/user/user.model'
import { UserService } from '~modules/user/user.service'

@Injectable()
export class GithubAuthService {
  constructor(
    private readonly userService: UserService,
  ) {}

  private readonly logger = new Logger(GithubAuthService.name)

  async validateUser(githubId: string): Promise<PublicUser> {
    const user = await this.userService.findOneByGithub(githubId)
    if (!user) {
      throw new Error('用户不存在')
    }
    const { passwd, passwdSalt, ...result } = user
    return result
  }
}

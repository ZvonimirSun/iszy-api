import { Injectable, Logger } from '@nestjs/common'
import { PublicUser } from '~entities/user'
import { UserService } from '~modules/core/user/user.service'
import { UserStatus } from '~modules/core/user/variables/user.status'
import { encodeUUID } from '~utils/uuid'

@Injectable()
export class GithubAuthService {
  constructor(
    private readonly userService: UserService,
  ) {}

  private readonly logger = new Logger(GithubAuthService.name)

  async validateUser(githubProfile: any): Promise<PublicUser> {
    let user = await this.userService.findOneByGithub(githubProfile.id)
    if (!user) {
      // 用户不存在
      try {
        let userName = githubProfile.userName
        const testUser = await this.userService.findOne(userName)
        if (testUser) {
          userName = `${userName}_${encodeUUID()}`
        }
        user = await this.userService.create({
          userName,
          nickName: githubProfile.displayName,
          email: githubProfile.emails[0].value,
          status: UserStatus.ENABLED,
          github: githubProfile.id,
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
    const { passwd, passwdSalt, ...result } = user
    return result
  }
}

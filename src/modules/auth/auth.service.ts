// src/logical/auth/auth.service.ts
import { Injectable, Logger } from '@nestjs/common'
import type { Sequelize } from 'sequelize-typescript'
import type { UserService } from '../user/user.service'
import { UserStatus } from '../user/variables/user.status'
import type { RegisterDto } from './dto/register.dto'
import { encryptPassword, makeSalt } from '~utils/cryptogram'
import type { User } from '~entities/user/user.model'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private sequelize: Sequelize,
  ) {}

  private readonly logger = new Logger(AuthService.name)

  async validateUser(
    username: string,
    password: string,
  ): Promise<Partial<User>> {
    const user = await this.usersService.findOne(username.toLowerCase())
    if (user) {
      const hashedPassword = user.passwd
      const salt = user.passwdSalt
      // 通过密码盐，加密传参，再与数据库里的比较，判断是否相等
      const hashPassword = encryptPassword(password, salt)
      if (hashedPassword === hashPassword) {
        if (user.status === UserStatus.DEACTIVATED) {
          this.logger.error('用户未激活')
          throw new Error('用户未激活')
        }
        else if (user.status === UserStatus.DISABLED) {
          this.logger.error('用户已停用')
          throw new Error('用户已停用')
        }
        // 密码正确
        const { passwd, passwdSalt, ...result } = user.get({
          plain: true,
        })
        return result
      }
      else {
        this.logger.error('密码错误')
        throw new Error('用户名或密码错误')
      }
    }
    // 查无此人
    this.logger.error('用户不存在')
    throw new Error('用户名或密码错误')
  }

  async register(registerDto: RegisterDto): Promise<void> {
    try {
      const user: Partial<User> = {}
      user.userName = registerDto.userName.toLowerCase()
      user.nickName = registerDto.nickName
      user.passwdSalt = makeSalt()
      user.passwd = encryptPassword(registerDto.password, user.passwdSalt)
      user.mobile = registerDto.mobile || undefined
      user.email = registerDto.email || undefined
      user.status = UserStatus.DEACTIVATED
      await this.usersService.create(user)
    }
    catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        const error = e.errors[0]
        if (error) {
          this.logger.error(error.message)
          switch (error.path) {
            case 'userName': {
              throw new Error('用户已存在')
            }
            case 'mobile': {
              throw new Error('手机号已存在')
            }
            case 'email': {
              throw new Error('邮箱已被绑定')
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
      throw new Error(e.name ? e.name + e.message : e.message)
    }
  }

  async getProfile(userName: string): Promise<Partial<User>> {
    const user = await this.usersService.findOne(userName)
    if (user) {
      const { passwd, passwdSalt, ...result } = user.get({
        plain: true,
      })
      return result
    }
    this.logger.error('用户不存在')
    throw new Error('用户不存在')
  }

  async updateProfile(
    userName: string,
    userProfile: Partial<User> & { oldPasswd?: string },
  ): Promise<Partial<User>> {
    try {
      return await this.sequelize.transaction(async (t) => {
        const user = await this.usersService.findOne(userName)
        if (user) {
          const newProfile: Partial<User> = {}
          if (userProfile.nickName)
            newProfile.nickName = userProfile.nickName

          if (userProfile.email)
            newProfile.email = userProfile.email

          newProfile.updateBy = user.userId
          let newUser: User
          if (!userProfile.oldPasswd && !userProfile.passwd) {
            newUser = await user.update(newProfile, { transaction: t })
          }
          else {
            const hashedPassword = user.passwd
            const salt = user.passwdSalt
            // 通过密码盐，加密传参，再与数据库里的比较，判断是否相等
            const hashPassword = encryptPassword(userProfile.oldPasswd, salt)
            if (hashedPassword === hashPassword) {
              newProfile.passwdSalt = makeSalt()
              newProfile.passwd = encryptPassword(
                userProfile.passwd,
                newProfile.passwdSalt,
              )
              newUser = await user.update(newProfile, { transaction: t })
            }
            else {
              this.logger.error('旧密码错误')
              throw new Error('旧密码错误')
            }
          }
          const { passwd, passwdSalt, ...result } = newUser.get({
            plain: true,
          })
          return result as Partial<User>
        }
        else {
          this.logger.error('用户不存在')
          throw new Error('用户不存在')
        }
      })
    }
    catch (e) {
      throw new Error(e.message)
    }
  }

  logout(userId: number, sid?: string) {
    if (userId == null)
      return

    if (!sid) {
    }
  }
}

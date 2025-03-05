import type { User } from '~entities/user/user.model'
import type { RegisterDto } from './dto/register.dto'
// src/logical/auth/auth.service.ts
import { Injectable, Logger } from '@nestjs/common'
import bcrypt from 'bcrypt'
import { encryptPassword } from '~utils/cryptogram'
import { UserService } from '../user/user.service'
import { UserStatus } from '../user/variables/user.status'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
  ) {}

  private readonly logger = new Logger(AuthService.name)

  async validateUser(
    username: string,
    password: string,
  ): Promise<Partial<User>> {
    const user = await this.usersService.findOne(username.toLowerCase())
    if (!user) {
      // 查无此人
      this.logger.error('用户不存在')
      throw new Error('用户名或密码错误')
    }
    let checkResult = false
    if (!user.passwdSalt) {
      checkResult = await bcrypt.compare(password, user.passwd)
    }
    else {
      checkResult = user.passwd === encryptPassword(password, user.passwdSalt)
    }
    if (!checkResult) {
      this.logger.error('密码错误')
      throw new Error('用户名或密码错误')
    }
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

  async register(registerDto: RegisterDto): Promise<void> {
    try {
      const user: Partial<User> = {}
      user.userName = registerDto.userName.toLowerCase()
      user.nickName = registerDto.nickName
      user.passwdSalt = ''
      user.passwd = await bcrypt.hash(registerDto.password, 10)
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
      const user = await this.usersService.findOne(userName)
      if (user) {
        const newProfile: Partial<User> = {}
        newProfile.userId = user.userId
        if (userProfile.nickName)
          newProfile.nickName = userProfile.nickName
        if (userProfile.email)
          newProfile.email = userProfile.email
        newProfile.updateBy = user.userId
        if (userProfile.oldPasswd && userProfile.passwd) {
          await this.usersService.checkUser(newProfile.userId, userProfile.oldPasswd)
          newProfile.passwd = userProfile.passwd
        }
        return await this.usersService.updateUser(userProfile)
      }
      else {
        this.logger.error('用户不存在')
        throw new Error('用户不存在')
      }
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

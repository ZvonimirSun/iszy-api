import type { RegisterDto } from './dto/register.dto'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import bcrypt from 'bcrypt'
import ms, { StringValue } from 'ms'
import { PublicUser, RawUser } from '~entities/user'
import { RedisCacheService } from '~modules/core/redisCache/redis-cache.service'
import { encryptPassword } from '~utils/cryptogram'
import { encodeUUID } from '~utils/uuid'
import { UserService } from '../user/user.service'
import { UserStatus } from '../user/variables/user.status'
import { UpdateProfileDto } from './dto/updateProfile.dto'
import { JwtPayload, RefreshJwtPayload } from './jwt.strategy'

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  private readonly logger = new Logger(AuthService.name)

  async validateUser(
    username: string,
    password: string,
  ): Promise<PublicUser> {
    const user = await this.userService.findOne(username.toLowerCase())
    const checkResult = await this._checkUser(user, password)
    if (!checkResult) {
      throw new Error('用户名或密码错误')
    }
    // 密码正确
    const { passwd, passwdSalt, ...result } = user
    return result
  }

  async generateToken(user: PublicUser, deviceId?: string): Promise<{
    access_token: string
    refresh_token: string
    profile: PublicUser
  }> {
    const accessExpireTime = this.configService.get<StringValue>('auth.jwt.expire')
    const refreshExpireTime = this.configService.get<StringValue>('auth.jwt.refreshExpire')
    const accessExpireMs = ms(accessExpireTime)
    const refreshExpireMs = ms(refreshExpireTime)

    if (refreshExpireMs <= accessExpireMs) {
      throw new Error('refresh_token 过期时间必须大于 access_token 过期时间')
    }

    if (typeof user === 'number') {
      const rawUser = await this.userService.findOne(user)
      if (!rawUser) {
        this.logger.error('用户不存在')
        throw new Error('用户不存在')
      }
      const { passwd, passwdSalt, ...publicUser } = rawUser
      user = publicUser
    }
    const userId = user.userId
    deviceId = deviceId || encodeUUID()

    const jwtPayload: JwtPayload = {
      deviceId,
      profile: user,
    }
    const accessToken = this.jwtService.sign(jwtPayload, {
      expiresIn: accessExpireTime,
    })

    const refreshJwtPayload: RefreshJwtPayload = {
      deviceId,
      refreshUserId: userId,
    }
    const refreshToken = this.jwtService.sign(refreshJwtPayload, {
      expiresIn: refreshExpireTime,
    })

    await this.redisCacheService.set(`device:userId:${userId}:${deviceId}`, refreshToken, refreshExpireMs)

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      profile: user,
    }
  }

  async register(registerDto: RegisterDto): Promise<void> {
    try {
      const user: Partial<RawUser> = {}
      user.userName = registerDto.userName.toLowerCase()
      user.nickName = registerDto.nickName
      user.passwd = await bcrypt.hash(registerDto.password, 10)
      user.mobile = registerDto.mobile || undefined
      user.email = registerDto.email || undefined
      user.status = this.configService.get<boolean>('auth.publicRegister') ? UserStatus.ENABLED : UserStatus.DEACTIVATED
      await this.userService.create(user)
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

  async getProfile(userName: string): Promise<PublicUser> {
    const user = await this.userService.findOne(userName)
    if (!user) {
      this.logger.error('用户不存在')
      throw new Error('用户不存在')
    }
    const { passwd, passwdSalt, ...result } = user
    return result
  }

  async updateProfile(
    userName: string,
    userProfile: UpdateProfileDto,
  ): Promise<PublicUser> {
    const user = await this.userService.findOne(userName)
    if (!user) {
      this.logger.error('用户不存在')
      throw new Error('用户不存在')
    }
    const newProfile: Partial<RawUser> = {}
    if (userProfile.oldPasswd && userProfile.passwd) {
      const checkResult = await this._checkUser(user, userProfile.oldPasswd, false)
      if (!checkResult) {
        this.logger.error('密码错误')
        throw new Error('密码错误')
      }
      newProfile.passwdSalt = ''
      newProfile.passwd = await bcrypt.hash(userProfile.passwd, 10)
    }
    newProfile.userId = user.userId
    if (userProfile.nickName)
      newProfile.nickName = userProfile.nickName
    if (userProfile.email)
      newProfile.email = userProfile.email
    if (userProfile.mobile)
      newProfile.mobile = userProfile.mobile
    newProfile.updateBy = user.userId
    const updatedUser = await this.userService.updateUser(newProfile)
    const { passwd, passwdSalt, ...result } = updatedUser
    return result
  }

  async logout(userId: number, deviceId?: string, other?: boolean) {
    if (userId == null)
      return

    // 登出所有设备
    if (!deviceId) {
      // todo
    }
    // 登出其他设备
    else if (other) {
      // todo
    }
    // 登出当前设备
    else {
      await this.redisCacheService.del(`device:userId:${userId}:${deviceId}`)
    }
  }

  async _checkUser(user: RawUser, passwd: string, checkStatus = true): Promise<boolean> {
    if (user == null) {
      this.logger.error('用户不存在')
      return false
    }
    let checkResult: boolean
    if (!user.passwdSalt) {
      checkResult = await bcrypt.compare(passwd, user.passwd)
    }
    else {
      checkResult = user.passwd === encryptPassword(passwd, user.passwdSalt)
    }
    if (!checkResult) {
      this.logger.error('密码错误')
      return false
    }
    if (!checkStatus) {
      return true
    }
    if (user.status === UserStatus.DEACTIVATED) {
      this.logger.error('用户待激活')
      throw new Error('用户待激活')
    }
    else if (user.status === UserStatus.DISABLED) {
      this.logger.error('用户已禁用')
      throw new Error('用户已禁用')
    }
    return true
  }
}

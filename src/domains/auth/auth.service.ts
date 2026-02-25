import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import {
  Device,
  DeviceCache,
  encodeUUID,
  PublicUser,
  RawUser,
  REGEX_EMAIL,
  REGEX_MOBILE_PHONE,
  RegisterUser,
  UpdateUser,
  UserStatus,
} from '@zvonimirsun/iszy-common'
import bcrypt from 'bcrypt'
import ms, { StringValue } from 'ms'
import { UserService } from '~domains/user/user.service'
import { JWTPayload, RefreshJWTPayload } from '~types/jwt'
import { MinimalUser } from '~types/user'
import { LogoutDto } from './dto/logout.dto'
import { DeviceStore } from './store/device-store'
import { encryptPassword } from './utils/cryptogram'

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly deviceStore: DeviceStore,
  ) {
    this.accessExpireTime = this.configService.get<StringValue>('auth.jwt.expire')
    this.refreshExpireTime = this.configService.get<StringValue>('auth.jwt.refreshExpire')
    this.accessExpireMs = ms(this.accessExpireTime)
    this.refreshExpireMs = ms(this.refreshExpireTime)

    if (this.refreshExpireMs <= this.accessExpireMs) {
      throw new Error('refresh_token 过期时间必须大于 access_token 过期时间')
    }
  }

  private readonly logger = new Logger(AuthService.name)
  private readonly accessExpireTime: StringValue
  private readonly refreshExpireTime: StringValue
  private readonly accessExpireMs: number
  private readonly refreshExpireMs: number

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

  async generateToken(user: MinimalUser, device: Device): Promise<{
    access_token: string
    refresh_token: string
    profile: PublicUser
  }> {
    const { userId, userName, nickName } = user
    let { id: deviceId, name: deviceName, ip: deviceIp } = device
    if (!deviceId) {
      deviceId = encodeUUID()
      this.logger.log(`${userName}新设备:${deviceName}:${deviceIp}`)
    }
    else {
      this.logger.log(`${userName}设备更新:${deviceName}:${deviceIp}`)
    }

    const jwtPayload: JWTPayload = {
      deviceId,
      profile: {
        userId,
        userName,
        nickName,
      },
    }
    const accessToken = this.jwtService.sign(jwtPayload, {
      expiresIn: this.accessExpireTime,
    })

    const refreshJwtPayload: RefreshJWTPayload = {
      deviceId,
      refreshUserId: userId,
    }
    const refreshToken = this.jwtService.sign(refreshJwtPayload, {
      expiresIn: this.refreshExpireTime,
    })

    const cacheDevice: DeviceCache = {
      ...device,
      refreshToken: await bcrypt.hash(refreshToken, 10),
      id: deviceId,
    }

    await this.deviceStore.addDevice(userId, cacheDevice)

    const { passwd, passwdSalt, ...userProfile } = await this.userService.findOne(userId)

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      profile: userProfile,
    }
  }

  async register(registerDto: RegisterUser): Promise<boolean> {
    try {
      this._normalizeUserInfo(registerDto)

      const publicRegister = this.configService.get<boolean>('auth.publicRegister')

      const user: Partial<RawUser> = {}
      user.userName = registerDto.userName
      user.nickName = registerDto.nickName
      user.passwd = await bcrypt.hash(registerDto.passwd, 10)
      user.mobile = registerDto.mobile || undefined
      user.email = registerDto.email || undefined
      user.status = publicRegister ? UserStatus.ENABLED : UserStatus.DEACTIVATED

      await this.userService.create(user)
      return publicRegister
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
    userProfile: UpdateUser,
  ): Promise<PublicUser> {
    const user = await this.userService.findOne(userName)
    if (!user) {
      this.logger.error('用户不存在')
      throw new Error('用户不存在')
    }
    const newProfile: Partial<RawUser> = {}
    this._normalizeUserInfo(userProfile)
    if (userProfile.passwd) {
      if (!user.passwd) {
        // 用户初始设置密码
        newProfile.passwd = await bcrypt.hash(userProfile.passwd, 10)
      }
      else {
        const checkResult = await this._checkUser(user, userProfile.oldPasswd, false)
        if (!checkResult) {
          this.logger.error('密码错误')
          throw new Error('密码错误')
        }
        newProfile.passwdSalt = ''
        newProfile.passwd = await bcrypt.hash(userProfile.passwd, 10)
      }
    }
    newProfile.userId = user.userId
    if (userProfile.userName)
      newProfile.userName = userProfile.userName
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

  async logout(userId: number, options: LogoutDto = {}) {
    if (userId == null)
      return

    await this.deviceStore.removeDevice(userId, options)
  }

  async bind(userId: number, type: string, id: string) {
    const types = ['github', 'linuxdo']
    if (!types.includes(type)) {
      throw new Error('不支持的绑定类型')
    }
    const user = await this.userService.findOne(userId)
    if (!user) {
      this.logger.error('用户不存在')
      throw new Error('用户不存在')
    }
    await this.userService.updateUser({
      userId,
      [type]: id,
    })
  }

  async unbind(userId: number, type: string) {
    const types = ['github', 'linuxdo']
    if (!types.includes(type)) {
      throw new Error('不支持的绑定类型')
    }
    const user = await this.userService.findOne(userId)
    if (!user) {
      this.logger.error('用户不存在')
      throw new Error('用户不存在')
    }
    await this.userService.updateUser({
      userId,
      [type]: null,
    })
  }

  async getDevices(userId: number): Promise<Device[]> {
    return await this.deviceStore.getDevices(userId)
  }

  private _normalizeUserInfo(userProfile: RegisterUser | UpdateUser) {
    if (userProfile.userName) {
      if (!userProfile.userName.trim()) {
        throw new Error('用户名值非法')
      }
      userProfile.userName = userProfile.userName.trim().toLowerCase()
    }
    if (userProfile.nickName) {
      if (!userProfile.nickName.trim()) {
        throw new Error('昵称值非法')
      }
      userProfile.nickName = userProfile.nickName.trim()
    }
    if (userProfile.email) {
      if (!userProfile.email.trim()) {
        throw new Error('邮箱值非法')
      }
      userProfile.email = userProfile.email.trim().toLowerCase()
      if (!REGEX_EMAIL.test(userProfile.email)) {
        throw new Error('邮箱值非法')
      }
    }
    if (userProfile.mobile) {
      if (!userProfile.mobile.trim()) {
        throw new Error('手机号值非法')
      }
      userProfile.mobile = userProfile.mobile.trim()
      if (!REGEX_MOBILE_PHONE.test(userProfile.mobile)) {
        throw new Error('手机号值非法')
      }
    }
  }

  private async _checkUser(user: RawUser, passwd: string = '', checkStatus = true): Promise<boolean> {
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

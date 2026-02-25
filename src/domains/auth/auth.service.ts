import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import {
  Device,
  DeviceCache,
  encodeUUID,
  PublicUser,
  RawUser,
  RegisterUser,
  UserStatus,
} from '@zvonimirsun/iszy-common'
import bcrypt from 'bcrypt'
import ms, { StringValue } from 'ms'
import { UserService } from '~domains/user/user.service'
import { JWTPayload, RefreshJWTPayload } from '~types/jwt'
import { MinimalUser } from '~types/user'
import { toPublicUser } from '~utils/user'
import { LogoutDto } from './dto/logout.dto'
import { DeviceStore } from './store/device-store'

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
    const checkResult = await this.userService.checkUser(user, password)
    if (!checkResult) {
      throw new Error('用户名或密码错误')
    }
    // 密码正确
    return toPublicUser(user)
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

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      profile: toPublicUser(await this.userService.findOne(userId)),
    }
  }

  async register(registerDto: RegisterUser): Promise<boolean> {
    try {
      this.userService.normalizeUserInfo(registerDto)

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

  async logout(userId: number, options: LogoutDto = {}) {
    if (userId == null)
      return

    await this.deviceStore.removeDevice(userId, options)
  }

  async getDevices(userId: number): Promise<Device[]> {
    return await this.deviceStore.getDevices(userId)
  }
}

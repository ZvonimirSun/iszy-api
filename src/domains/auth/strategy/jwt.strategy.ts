import type { AuthRequest } from '~types/AuthRequest'
import { Injectable, Req, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { UserStatus } from '@zvonimirsun/iszy-common'
import bcrypt from 'bcrypt'
import { ExtractJwt, JwtFromRequestFunction, Strategy } from 'passport-jwt'
import { UserService } from '~domains/user/user.service'
import { JWTPayload, RefreshJWTPayload } from '~types/jwt'
import { toMinimalUser } from '~utils/user'
import { DeviceStore } from '../store/device-store'
import { generateDevice } from '../utils/generateDevice'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly _jwtFromRequest: JwtFromRequestFunction

  constructor(configService: ConfigService, private deviceStore: DeviceStore, private userService: UserService) {
    const jwtFromRequest = ExtractJwt.fromExtractors([
      ExtractJwt.fromUrlQueryParameter('access_token'),
      ExtractJwt.fromBodyField('access_token'),
      ExtractJwt.fromAuthHeaderAsBearerToken(),
    ])
    super({
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: configService.get('auth.jwt.secret'),
      passReqToCallback: true,
    })
    this._jwtFromRequest = jwtFromRequest
  }

  async validate(@Req() req: AuthRequest, payload: JWTPayload | RefreshJWTPayload) {
    const deviceId = payload.deviceId
    req.device = {
      ...generateDevice(req),
      id: deviceId,
    }
    if ('refreshUserId' in payload) {
      const token = this._jwtFromRequest(req)
      const currentDevice = await this.deviceStore.getDevice(deviceId)
      if (!currentDevice) {
        throw new UnauthorizedException('设备未找到，可能已被删除')
      }
      if (token !== currentDevice.refreshToken && !(await bcrypt.compare(token, currentDevice.refreshToken))) {
        // 刷新令牌不匹配，可能是被盗用，删除设备缓存
        await this.deviceStore.removeDevice(payload.refreshUserId, { deviceId })
        throw new UnauthorizedException('刷新令牌无效，可能已被盗用，设备已被删除')
      }
      const rawUser = await this.userService.findOne(payload.refreshUserId)
      if (!rawUser || rawUser.status !== UserStatus.ENABLED) {
        throw new UnauthorizedException('用户未找到或已被禁用')
      }
      req.isRefresh = true
      return toMinimalUser(rawUser)
    }
    else if ('profile' in payload) {
      return payload.profile
    }
    else {
      throw new UnauthorizedException('无效的令牌载荷')
    }
  }
}

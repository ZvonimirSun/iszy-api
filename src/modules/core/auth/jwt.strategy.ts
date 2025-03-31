import type { AuthRequest } from '~types/AuthRequest'
import { Injectable, Req, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, JwtFromRequestFunction, Strategy } from 'passport-jwt'
import { PublicUser } from '~entities/user'
import { RedisCacheService } from '~modules/core/redisCache/redis-cache.service'
import { UserService } from '~modules/core/user/user.service'

export interface JwtPayload {
  deviceId: string
  profile: PublicUser
}

export interface RefreshJwtPayload {
  deviceId: string
  refreshUserId: PublicUser['userId']
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly _jwtFromRequest: JwtFromRequestFunction

  constructor(configService: ConfigService, private redisCacheService: RedisCacheService, private userService: UserService) {
    const jwtFromRequest = ExtractJwt.fromUrlQueryParameter('access_token')
    super({
      jwtFromRequest: ExtractJwt.fromUrlQueryParameter('access_token'),
      ignoreExpiration: false,
      secretOrKey: configService.get('auth.jwt.secret'),
      passReqToCallback: true,
    })
    this._jwtFromRequest = jwtFromRequest
  }

  async validate(@Req() req: AuthRequest, payload: JwtPayload | RefreshJwtPayload) {
    req.deviceId = payload.deviceId
    if ('refreshUserId' in payload) {
      const token = this._jwtFromRequest(req)
      const currentToken = await this.redisCacheService.get(`device:userId:${payload.refreshUserId}:${payload.deviceId}`)
      if (token !== currentToken) {
        throw new UnauthorizedException()
      }
      const rawUser = await this.userService.findOne(payload.refreshUserId)
      if (!rawUser) {
        throw new UnauthorizedException()
      }
      req.isRefresh = true
      const { passwd, passwdSalt, ...publicUser } = rawUser
      return publicUser
    }
    else if ('profile' in payload) {
      return payload.profile
    }
    else {
      throw new UnauthorizedException()
    }
  }
}

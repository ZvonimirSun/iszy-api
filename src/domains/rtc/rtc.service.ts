import type { RtcConfig } from '~shared'
import type { IceServersDto } from './dto/ice-servers.dto'
import { createHmac } from 'node:crypto'
import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class RtcService {
  constructor(private readonly configService: ConfigService) {}

  getIceServers(): IceServersDto {
    const config = this.configService.get<RtcConfig>('rtc')
    if (!config?.authSecret) {
      throw new InternalServerErrorException('TURN auth secret is not configured')
    }

    const expiresAt = Math.floor(Date.now() / 1000) + config.credentialTtl
    const username = `${expiresAt}:public`
    const credential = createHmac('sha1', config.authSecret)
      .update(username)
      .digest('base64')

    return {
      ttl: config.credentialTtl,
      expiresAt,
      iceServers: [
        {
          urls: [`stun:${config.host}:${config.stunPort}`],
        },
        {
          urls: [
            `turn:${config.host}:${config.turnPort}?transport=udp`,
            `turn:${config.host}:${config.turnPort}?transport=tcp`,
            `turns:${config.host}:${config.turnsPort}?transport=tcp`,
          ],
          username,
          credential,
        },
      ],
    }
  }
}

import type { RtcConfig } from '~shared'
import type { FileTransferSessionDto } from './dto/file-transfer.dto'
import type { IceServersDto } from './dto/ice-servers.dto'
import { createHmac, randomUUID } from 'node:crypto'
import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class RtcService {
  constructor(private readonly configService: ConfigService) {}

  getIceServers(): IceServersDto {
    return this.buildIceServers('public')
  }

  createFileTransferSession(): FileTransferSessionDto {
    const uid = this.createFileTransferUid()
    const iceServers = this.buildIceServers(uid)

    return {
      uid,
      peerId: this.createPeerId(),
      role: 'offer',
      ttl: iceServers.ttl,
      expiresAt: iceServers.expiresAt,
      iceServers: iceServers.iceServers,
    }
  }

  getFileTransferIceServers(uid: string) {
    return this.buildIceServers(uid)
  }

  private buildIceServers(uid: string): IceServersDto {
    const config = this.configService.get<RtcConfig>('rtc')
    if (!config?.authSecret) {
      throw new InternalServerErrorException('TURN auth secret is not configured')
    }

    const normalizedUid = this.normalizeIceUsernameUid(uid)
    const expiresAt = Math.floor(Date.now() / 1000) + config.credentialTtl
    const username = `${expiresAt}:${normalizedUid}`
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

  private normalizeIceUsernameUid(uid: string) {
    return `${uid || 'public'}`.trim() || 'public'
  }

  private createFileTransferUid() {
    return randomUUID().replace(/-/g, '').slice(0, 5).toLowerCase()
  }

  private createPeerId() {
    return `peer_${randomUUID().replace(/-/g, '').slice(0, 8)}`
  }
}

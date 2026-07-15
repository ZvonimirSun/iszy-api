import type { Cache } from 'cache-manager'
import type { RtcConfig } from '~shared'
import type {
  CreateFileTransferSignalMessageDto,
  FileTransferSignalMessageDto,
  FileTransferSignalMessagesDto,
  FileTransferSignalType,
} from './dto/file-transfer.dto'
import type { IceServersDto } from './dto/ice-servers.dto'
import { createHmac, randomUUID } from 'node:crypto'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

interface FileTransferRoom {
  id: string
  seq: number
  messages: FileTransferSignalMessageDto[]
  createdAt: number
  updatedAt: number
}

const FILE_TRANSFER_ROOM_TTL = 30 * 60 * 1000
const MAX_FILE_TRANSFER_MESSAGES_PER_ROOM = 200
const signalTypes = new Set<FileTransferSignalType>(['offer', 'answer', 'candidate', 'leave'])

@Injectable()
export class RtcService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

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

  async createFileTransferRoom() {
    let roomId = this.createFileTransferRoomId()
    while (await this.getFileTransferRoom(roomId)) {
      roomId = this.createFileTransferRoomId()
    }

    const now = Date.now()
    await this.saveFileTransferRoom({
      id: roomId,
      seq: 0,
      messages: [],
      createdAt: now,
      updatedAt: now,
    })

    return {
      roomId,
    }
  }

  async getFileTransferRoomStatus(roomId: string) {
    const normalizedRoomId = this.normalizeFileTransferRoomId(roomId)

    return {
      roomId: normalizedRoomId,
      exists: !!(await this.getFileTransferRoom(normalizedRoomId)),
    }
  }

  async getFileTransferSignalMessages(roomId: string, peerId: string, after = 0): Promise<FileTransferSignalMessagesDto> {
    const room = await this.getActiveFileTransferRoom(roomId)
    const messages = room.messages.filter(message => message.seq > after && message.peerId !== peerId)

    return {
      messages,
      latestSeq: room.seq,
    }
  }

  async createFileTransferSignalMessage(roomId: string, dto: CreateFileTransferSignalMessageDto) {
    if (!dto.peerId || !dto.type || !signalTypes.has(dto.type)) {
      throw new BadRequestException('信令消息格式不正确')
    }

    const room = await this.getActiveFileTransferRoom(roomId)
    room.seq += 1
    room.updatedAt = Date.now()

    const message: FileTransferSignalMessageDto = {
      seq: room.seq,
      peerId: dto.peerId,
      type: dto.type,
      payload: dto.payload,
      createdAt: room.updatedAt,
    }
    room.messages.push(message)

    if (room.messages.length > MAX_FILE_TRANSFER_MESSAGES_PER_ROOM) {
      room.messages.splice(0, room.messages.length - MAX_FILE_TRANSFER_MESSAGES_PER_ROOM)
    }

    await this.saveFileTransferRoom(room)

    return {
      seq: message.seq,
    }
  }

  private createFileTransferRoomId() {
    return randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()
  }

  private normalizeFileTransferRoomId(roomId: string) {
    return `${roomId || ''}`.trim().toUpperCase()
  }

  private getFileTransferRoomKey(roomId: string) {
    return `rtc:file-transfer:room:${this.normalizeFileTransferRoomId(roomId)}`
  }

  private async getFileTransferRoom(roomId: string) {
    const room = await this.cacheManager.get<FileTransferRoom>(this.getFileTransferRoomKey(roomId))
    if (room) {
      room.updatedAt = Date.now()
      await this.saveFileTransferRoom(room)
    }
    return room
  }

  private async getActiveFileTransferRoom(roomId: string) {
    const room = await this.getFileTransferRoom(roomId)
    if (!room) {
      throw new NotFoundException('房间不存在或已过期')
    }
    return room
  }

  private async saveFileTransferRoom(room: FileTransferRoom) {
    await this.cacheManager.set(this.getFileTransferRoomKey(room.id), room, FILE_TRANSFER_ROOM_TTL)
  }
}

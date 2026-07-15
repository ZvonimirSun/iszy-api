import type { IncomingMessage } from 'node:http'
import type { Socket } from 'node:net'
import type { RawData } from 'ws'
import { Buffer } from 'node:buffer'
import { Injectable } from '@nestjs/common'
import { WebSocket, WebSocketServer } from 'ws'
import { random } from '~shared'
import { RtcService } from './rtc.service'

type FileTransferSignalRole = 'offer' | 'answer'

interface FileTransferSignalingMessage {
  uid?: string
  peer_id?: string
  peerId?: string
  role?: FileTransferSignalRole
  type?: string
  data?: unknown
  offer?: unknown
}

interface FileTransferSignalingClient {
  peerId: string
  uid?: string
  role?: FileTransferSignalRole
  socket: WebSocket
}

@Injectable()
export class RtcSignalingService {
  private readonly rooms = new Map<string, Set<FileTransferSignalingClient>>()
  private readonly clients = new WeakMap<WebSocket, FileTransferSignalingClient>()
  private server?: WebSocketServer
  private pingTimer?: NodeJS.Timeout

  constructor(private readonly rtcService: RtcService) {}

  bind(httpServer: {
    on: (event: 'upgrade', listener: (request: IncomingMessage, socket: Socket, head: Buffer) => void) => void
  }) {
    if (this.server) {
      return
    }

    this.server = new WebSocketServer({ noServer: true })
    httpServer.on('upgrade', (request, socket, head) => {
      if (!this.isSignalingRequest(request)) {
        return
      }

      this.server!.handleUpgrade(request, socket, head, (ws) => {
        this.handleConnection(ws)
      })
    })

    this.pingTimer = setInterval(() => {
      for (const client of this.clientsSnapshot()) {
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.ping()
        }
      }
    }, 30000)
    this.pingTimer.unref()
  }

  private isSignalingRequest(request: IncomingMessage) {
    const host = request.headers.host || 'localhost'
    const url = new URL(request.url || '', `http://${host}`)
    return url.pathname === '/rtc/file-transfer/signaling'
  }

  private handleConnection(socket: WebSocket) {
    const client: FileTransferSignalingClient = {
      peerId: this.createPeerId(),
      socket,
    }
    this.clients.set(socket, client)

    socket.on('message', data => this.handleMessage(client, data))
    socket.on('close', () => this.handleDisconnect(client))
    socket.on('error', () => this.handleDisconnect(client))
  }

  private handleMessage(client: FileTransferSignalingClient, data: RawData) {
    const message = this.parseMessage(data)
    if (!message) {
      this.send(client, {
        type: 'error',
        message: '信令消息格式不正确',
      })
      return
    }

    const uid = this.normalizeUid(message.uid || client.uid)
    const role = message.role || client.role
    const peerId = message.peer_id || message.peerId || client.peerId

    if (!uid) {
      this.send(client, {
        type: 'error',
        message: '缺少 uid',
      })
      return
    }

    if (message.type === 'register') {
      if (role !== 'offer') {
        this.send(client, {
          uid,
          type: 'error',
          message: 'register 仅用于 offer 端',
        })
        return
      }

      this.registerClient(client, uid, role, peerId, {
        sendRegistered: false,
        notifyPeerJoined: false,
      })
      return
    }

    if (message.type === 'join') {
      this.registerClient(client, uid, 'answer', peerId, {
        sendJoined: true,
        sendRegistered: false,
        notifyPeerJoined: true,
      })
      return
    }

    if (!client.uid) {
      this.registerClient(client, uid, role || 'answer', peerId)
    }

    this.forward(client, {
      ...message,
      uid,
      role: client.role,
    })
  }

  private registerClient(
    client: FileTransferSignalingClient,
    uid: string,
    role: FileTransferSignalRole,
    peerId: string,
    options: {
      sendJoined?: boolean
      sendRegistered?: boolean
      notifyPeerJoined?: boolean
    } = {},
  ) {
    this.leaveRoom(client, options.notifyPeerJoined)

    client.uid = uid
    client.role = role
    client.peerId = peerId

    let room = this.rooms.get(uid)
    if (!room) {
      room = new Set()
      this.rooms.set(uid, room)
    }
    room.add(client)

    if (options.sendRegistered) {
      this.send(client, {
        uid,
        peer_id: client.peerId,
        role,
        type: 'registered',
        peers: this.getRoomPeers(uid, client),
      })
    }

    if (options.sendJoined) {
      const iceServers = this.rtcService.getFileTransferIceServers(uid)
      this.send(client, {
        uid,
        peer_id: client.peerId,
        role,
        type: 'joined',
        ttl: iceServers.ttl,
        expiresAt: iceServers.expiresAt,
        iceServers: iceServers.iceServers,
      })
    }

    if (options.notifyPeerJoined) {
      this.notifyOfferClients(uid, {
        active_receivers: this.countRoomClients(uid, 'answer'),
        peer_id: client.peerId,
        role: 'server',
        total_receivers: this.countRoomClients(uid, 'answer'),
        type: 'peer_joined',
      })
    }
  }

  private handleDisconnect(client: FileTransferSignalingClient) {
    this.leaveRoom(client)
    this.clients.delete(client.socket)
  }

  private leaveRoom(client: FileTransferSignalingClient, notify = true) {
    if (!client.uid) {
      return
    }

    const uid = client.uid
    const room = this.rooms.get(uid)
    if (!room) {
      return
    }

    room.delete(client)
    if (notify) {
      this.forward(client, {
        uid,
        peer_id: client.peerId,
        role: client.role,
        type: 'peer-left',
      })
    }

    if (room.size === 0) {
      this.rooms.delete(uid)
    }

    client.uid = undefined
    client.role = undefined
  }

  private forward(sender: FileTransferSignalingClient, message: Record<string, unknown>) {
    if (!sender.uid) {
      return
    }

    const room = this.rooms.get(sender.uid)
    if (!room) {
      return
    }

    const targetPeerId = this.getTargetPeerId(message)
    for (const client of room) {
      if (client !== sender && (!targetPeerId || client.peerId === targetPeerId)) {
        this.send(client, message)
      }
    }
  }

  private getTargetPeerId(message: Record<string, unknown>) {
    const peerId = message.peer_id || message.peerId
    return typeof peerId === 'string' && peerId
      ? peerId
      : ''
  }

  private notifyOfferClients(uid: string, message: Record<string, unknown>) {
    const room = this.rooms.get(uid)
    if (!room) {
      return
    }

    for (const client of room) {
      if (client.role === 'offer') {
        this.send(client, message)
      }
    }
  }

  private countRoomClients(uid: string, role: FileTransferSignalRole) {
    return [...(this.rooms.get(uid) || [])].filter(client => client.role === role).length
  }

  private send(client: FileTransferSignalingClient, message: Record<string, unknown>) {
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify(message))
    }
  }

  private getRoomPeers(uid: string, currentClient: FileTransferSignalingClient) {
    return [...(this.rooms.get(uid) || [])]
      .filter(client => client !== currentClient)
      .map(client => ({
        peer_id: client.peerId,
        role: client.role,
      }))
  }

  private parseMessage(data: RawData): FileTransferSignalingMessage | null {
    try {
      const text = Array.isArray(data)
        ? Buffer.concat(data).toString('utf-8')
        : data.toString('utf-8')
      const message = JSON.parse(text)
      return typeof message === 'object' && message
        ? message
        : null
    }
    catch (e) {
      return null
    }
  }

  private clientsSnapshot() {
    return [...this.rooms.values()].flatMap(room => [...room])
  }

  private normalizeUid(uid?: string) {
    return `${uid || ''}`.trim()
  }

  private createPeerId() {
    return `peer_${random(6)}`
  }
}

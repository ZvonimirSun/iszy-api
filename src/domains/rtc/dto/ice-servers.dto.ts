export class IceServerDto {
  urls: string[]
  username?: string
  credential?: string
}

export class IceServersDto {
  ttl: number
  expiresAt: number
  iceServers: IceServerDto[]
}

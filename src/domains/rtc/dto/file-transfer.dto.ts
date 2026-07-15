import { ApiProperty } from '@nestjs/swagger'
import { IceServerDto } from './ice-servers.dto'

export class FileTransferSessionDto {
  @ApiProperty({
    description: '文件传输接收码',
  })
  uid: string

  @ApiProperty({
    description: '发送端 peer 标识',
  })
  peerId: string

  @ApiProperty({
    description: '当前端角色',
  })
  role: 'offer'

  @ApiProperty({
    description: 'ICE 配置有效秒数',
  })
  ttl: number

  @ApiProperty({
    description: 'ICE 配置过期时间戳',
  })
  expiresAt: number

  @ApiProperty({
    description: 'ICE servers',
    type: [IceServerDto],
  })
  iceServers: IceServerDto[]
}

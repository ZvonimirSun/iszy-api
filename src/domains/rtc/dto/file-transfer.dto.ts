import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export type FileTransferSignalType = 'offer' | 'answer' | 'candidate' | 'leave'

export class CreateFileTransferRoomDto {
  @ApiProperty({
    description: '房间码',
  })
  roomId: string
}

export class FileTransferRoomStatusDto {
  @ApiProperty({
    description: '房间码',
  })
  roomId: string

  @ApiProperty({
    description: '房间是否存在',
  })
  exists: boolean
}

export class FileTransferSignalMessageDto {
  @ApiProperty({
    description: '消息序号',
  })
  seq: number

  @ApiProperty({
    description: '发送端标识',
  })
  peerId: string

  @ApiProperty({
    description: '信令消息类型',
    enum: ['offer', 'answer', 'candidate', 'leave'],
  })
  type: FileTransferSignalType

  @ApiPropertyOptional({
    description: '信令载荷',
  })
  payload?: unknown

  @ApiProperty({
    description: '创建时间',
  })
  createdAt: number
}

export class FileTransferSignalMessagesDto {
  @ApiProperty({
    description: '信令消息列表',
    type: [FileTransferSignalMessageDto],
  })
  messages: FileTransferSignalMessageDto[]

  @ApiProperty({
    description: '当前最新消息序号',
  })
  latestSeq: number
}

export class CreateFileTransferSignalMessageDto {
  @ApiProperty({
    description: '发送端标识',
  })
  peerId: string

  @ApiProperty({
    description: '信令消息类型',
    enum: ['offer', 'answer', 'candidate', 'leave'],
  })
  type: FileTransferSignalType

  @ApiPropertyOptional({
    description: '信令载荷',
  })
  payload?: unknown
}

export class CreateFileTransferSignalMessageResultDto {
  @ApiProperty({
    description: '消息序号',
  })
  seq: number
}

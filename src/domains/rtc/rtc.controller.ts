import type { ResultDto } from '@zvonimirsun/iszy-common'
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '~shared'
import {
  CreateFileTransferRoomDto,
  CreateFileTransferSignalMessageDto,
  CreateFileTransferSignalMessageResultDto,
  FileTransferRoomStatusDto,
  FileTransferSignalMessagesDto,
} from './dto/file-transfer.dto'
import { IceServersDto } from './dto/ice-servers.dto'
import { RtcService } from './rtc.service'

@ApiTags('RTC')
@Public()
@Controller('rtc')
export class RtcController {
  constructor(private readonly rtcService: RtcService) {}

  @Get('ice-servers')
  getIceServers(): ResultDto<IceServersDto> {
    return {
      success: true,
      message: '获取成功',
      data: this.rtcService.getIceServers(),
    }
  }

  @Post('file-transfer/rooms')
  async createFileTransferRoom(): Promise<ResultDto<CreateFileTransferRoomDto>> {
    return {
      success: true,
      message: '创建成功',
      data: await this.rtcService.createFileTransferRoom(),
    }
  }

  @Get('file-transfer/rooms/:roomId')
  async getFileTransferRoomStatus(@Param('roomId') roomId: string): Promise<ResultDto<FileTransferRoomStatusDto>> {
    return {
      success: true,
      message: '获取成功',
      data: await this.rtcService.getFileTransferRoomStatus(roomId),
    }
  }

  @Get('file-transfer/rooms/:roomId/messages')
  async getFileTransferSignalMessages(
    @Param('roomId') roomId: string,
    @Query('peerId') peerId: string,
    @Query('after') after = '0',
  ): Promise<ResultDto<FileTransferSignalMessagesDto>> {
    return {
      success: true,
      message: '获取成功',
      data: await this.rtcService.getFileTransferSignalMessages(roomId, peerId, Number(after || 0)),
    }
  }

  @Post('file-transfer/rooms/:roomId/messages')
  async createFileTransferSignalMessage(
    @Param('roomId') roomId: string,
    @Body() dto: CreateFileTransferSignalMessageDto,
  ): Promise<ResultDto<CreateFileTransferSignalMessageResultDto>> {
    return {
      success: true,
      message: '发送成功',
      data: await this.rtcService.createFileTransferSignalMessage(roomId, dto),
    }
  }
}

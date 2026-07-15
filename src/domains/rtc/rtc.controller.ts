import type { ResultDto } from '@zvonimirsun/iszy-common'
import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '~shared'
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
}

import { ApiTags } from '@nestjs/swagger'
import { Controller, Get, Param, Query } from '@nestjs/common'
import { DDNSService } from './ddns.service'
import { DDNSUpdateDto } from './dto/ddns_update.dto'

@ApiTags('DDNS')
@Controller('ddns')
export class DDNSController {
  constructor(private readonly ddnsService: DDNSService) {}

  @Get(':type/update')
  async update(@Param('type') type: string, @Query() query: DDNSUpdateDto) {
    return await this.ddnsService.update(type, query)
  }
}

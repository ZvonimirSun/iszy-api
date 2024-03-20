import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { HolidayService } from './holiday.service'
import type { ImportHolidayDto } from './dto/import_holiday.dto'
import type { ResultDto } from '~core/dto/result.dto'
import { AuthGuard } from '~core/guard/custom-auth.guard'

@ApiTags('Holiday')
@Controller('tools/holiday')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @UseGuards(AuthGuard)
  @Post()
  async importHoliday(
    @Body() importHolidayDto: ImportHolidayDto,
  ): Promise<ResultDto<null>> {
    try {
      await this.holidayService.importHoliday(importHolidayDto)
      return {
        success: true,
        message: '导入成功',
      }
    }
    catch (e) {
      return {
        success: false,
        message: `导入失败，${e.message}`,
      }
    }
  }

  @Get()
  async isHolidayNow(): Promise<ResultDto<any>> {
    try {
      return {
        success: true,
        data: await this.holidayService.isHoliday(),
        message: '获取成功',
      }
    }
    catch (e) {
      return {
        success: false,
        message: `获取失败，${e.message}`,
      }
    }
  }

  @Get('holiday.ics')
  @Header('content-type', 'text/calendar')
  @Header('content-disposition', 'attachment; filename=holiday.ics')
  async getHolidayICS(): Promise<string> {
    return await this.holidayService.getHolidayICS()
  }

  @Get(':date')
  async isHolidayByDate(@Param('date') date?: number): Promise<
    ResultDto<{
      isHoliday: boolean
      desc: string
      date?: string
    }>
  > {
    try {
      return {
        success: true,
        data: await this.holidayService.isHoliday(date),
        message: '获取成功',
      }
    }
    catch (e) {
      return {
        success: false,
        message: `获取失败，${e.message}`,
      }
    }
  }
}

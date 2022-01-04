import { Body, Controller, Get, Header, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HolidayService } from './holiday.service';
import { ImportHolidayDto } from './dto/import_holiday.dto';
import { ResultDto } from '../../core/result.dto';

@ApiTags('Tools/Holiday')
@Controller('tools/holiday')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Post()
  async importHoliday(
    @Body() importHolidayDto: ImportHolidayDto,
  ): Promise<ResultDto> {
    try {
      await this.holidayService.importHoliday(importHolidayDto);
      return {
        code: '00000',
        message: '导入成功',
      };
    } catch (e) {
      return {
        code: 'C0102',
        message: `导入失败，${e.message}`,
      };
    }
  }

  @Get()
  async isHolidayNow(): Promise<ResultDto> {
    try {
      return {
        code: '00000',
        data: await this.holidayService.isHoliday(),
        message: '获取成功',
      };
    } catch (e) {
      return {
        code: 'C0100',
        message: `获取失败，${e.message}`,
      };
    }
  }

  @Get('holiday.ics')
  @Header('content-type', 'text/calendar')
  async getHolidayICS(): Promise<string> {
    return await this.holidayService.getHolidayICS();
  }

  @Get(':date')
  async isHolidayByDate(@Param('date') date?: number): Promise<ResultDto> {
    try {
      return {
        code: '00000',
        data: await this.holidayService.isHoliday(date),
        message: '获取成功',
      };
    } catch (e) {
      return {
        code: 'C0100',
        message: `获取失败，${e.message}`,
      };
    }
  }
}

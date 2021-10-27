import { Body, Controller, Get, Header, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HolidayService } from './holiday.service';
import { ImportHolidayDto } from './dto/import_holiday.dto';

@ApiTags('Tools/Holiday')
@Controller('tools/holiday')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Post()
  importHoliday(@Body() importHolidayDto: ImportHolidayDto) {
    return this.holidayService.importHoliday(importHolidayDto);
  }

  @Get()
  isHolidayNow() {
    return this.holidayService.isHoliday();
  }

  @Get('holiday.ics')
  @Header('content-type', 'text/calendar')
  getHolidayICS() {
    return this.holidayService.getHolidayICS();
  }

  @Get(':date')
  isHolidayByDate(@Param('date') date?: number) {
    return this.holidayService.isHoliday(date);
  }
}

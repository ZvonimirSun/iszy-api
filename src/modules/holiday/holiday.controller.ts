import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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

  @Get(':date')
  isHolidayByDate(@Param('date') date?: number) {
    console.log(date);
    return this.holidayService.isHoliday(date);
  }
}

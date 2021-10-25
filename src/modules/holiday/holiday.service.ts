import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Holiday } from './entities/holiday.model';
import { ImportHolidayDto } from './dto/import_holiday.dto';
import { ImportWorkdayDto } from './dto/import_workday.dto';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class HolidayService {
  constructor(
    @InjectModel(Holiday) private holidayModel: typeof Holiday,
    private sequelize: Sequelize,
  ) {}

  async importHoliday(importHolidayDto: ImportHolidayDto) {
    if (importHolidayDto.endDate - importHolidayDto.startDate >= 0) {
      try {
        await this.sequelize.transaction(async (t) => {
          const transactionHost = { transaction: t };
          for (
            let i = 0;
            i < importHolidayDto.endDate - importHolidayDto.startDate + 1;
            i++
          ) {
            await this.holidayModel.create(
              {
                id: importHolidayDto.startDate + i,
                desc: importHolidayDto.desc,
                isHoliday: true,
                last: importHolidayDto.endDate - importHolidayDto.startDate + 1,
              } as Holiday,
              transactionHost,
            );
          }
        });
        return true;
      } catch (e) {
        return false;
      }
    } else {
      return false;
    }
  }

  async importWorkDay(importWorkdayDto: ImportWorkdayDto) {
    try {
      await this.sequelize.transaction(async (t) => {
        const transactionHost = { transaction: t };
        await this.holidayModel.create(
          {
            id: importWorkdayDto.date,
            desc: importWorkdayDto.desc,
            isHoliday: false,
            last: null,
          } as Holiday,
          transactionHost,
        );
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  isHoliday() {
    return true;
  }
}

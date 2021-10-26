import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Holiday } from './entities/holiday.model';
import { ImportHolidayDto } from './dto/import_holiday.dto';
import { ImportWorkdayDto } from './dto/import_workday.dto';
import { Sequelize } from 'sequelize-typescript';
import dayjs from 'dayjs';

@Injectable()
export class HolidayService {
  constructor(
    @InjectModel(Holiday) private holidayModel: typeof Holiday,
    private sequelize: Sequelize,
  ) {}

  async importHoliday(importHolidayDto: ImportHolidayDto) {
    if (importHolidayDto.endDate - importHolidayDto.startDate >= 0) {
      try {
        const startDate = dayjs(
          importHolidayDto.startDate.toString(),
          'YYYYMMDD',
        );
        const endDate = dayjs(importHolidayDto.endDate.toString(), 'YYYYMMDD');
        const last = endDate.diff(startDate, 'day') + 1;
        await this.sequelize.transaction(async (t) => {
          const transactionHost = { transaction: t };
          for (let i = 0; i < last; i++) {
            const tmp = startDate.add(i, 'day');
            await this.holidayModel.create(
              {
                id: parseInt(tmp.format('YYYYMMDD')),
                desc: importHolidayDto.desc,
                isHoliday: true,
                last,
              } as Holiday,
              transactionHost,
            );
          }
        });
        return true;
      } catch (e) {
        console.error(e);
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
      console.error(e);
      return false;
    }
  }

  async isHoliday(date?: number) {
    try {
      let day = dayjs();
      if (date != null) {
        day = dayjs(date.toString(), 'YYYYMMDD');
      } else {
        date = parseInt(day.format('YYYYMMDD'));
      }
      const result = await this.holidayModel.findOne({
        where: {
          id: date,
        },
      });
      if (result) {
        return { isHoliday: result.isHoliday, desc: result.desc };
      } else {
        if (day.day() === 0 || day.day() === 6) {
          return {
            date: day.format('YYYY-MM-DD'),
            isHoliday: true,
            desc: '周末',
          };
        } else {
          return {
            date: day.format('YYYY-MM-DD'),
            isHoliday: false,
            desc: '工作日',
          };
        }
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}
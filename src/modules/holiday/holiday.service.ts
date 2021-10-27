import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Holiday } from './entities/holiday.model';
import { ImportHolidayDto } from './dto/import_holiday.dto';
import { Sequelize } from 'sequelize-typescript';
import dayjs from 'dayjs';
import { ResultDto } from '../../core/result.dto';

@Injectable()
export class HolidayService {
  constructor(
    @InjectModel(Holiday) private holidayModel: typeof Holiday,
    private sequelize: Sequelize,
  ) {}

  async importHoliday(importHolidayDto: ImportHolidayDto): Promise<ResultDto> {
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
          if (
            importHolidayDto.workdays &&
            importHolidayDto.workdays.length > 0
          ) {
            for (const date of importHolidayDto.workdays) {
              await this.holidayModel.create(
                {
                  id: date,
                  desc: importHolidayDto.desc + '调休',
                  isHoliday: false,
                  last: null,
                } as Holiday,
                transactionHost,
              );
            }
          }
        });
        return {
          code: '00000',
          message: '导入成功',
        };
      } catch (e) {
        console.error(e);
        return {
          code: 'C0102',
          message: `导入失败，重复导入`,
        };
      }
    } else {
      return {
        code: 'B0102',
        message: '导入失败，参数有误',
      };
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

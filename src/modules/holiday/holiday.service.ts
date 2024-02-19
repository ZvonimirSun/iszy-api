import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Holiday } from '~entities/holiday/holiday.model';
import { ImportHolidayDto } from './dto/import_holiday.dto';
import { Sequelize } from 'sequelize-typescript';
import dayjs from 'dayjs';

@Injectable()
export class HolidayService {
  constructor(
    @InjectModel(Holiday) private holidayModel: typeof Holiday,
    private sequelize: Sequelize,
  ) {}

  async importHoliday(importHolidayDto: ImportHolidayDto): Promise<void> {
    if (importHolidayDto.endDate - importHolidayDto.startDate >= 0) {
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
            },
            transactionHost,
          );
        }
        if (importHolidayDto.workdays && importHolidayDto.workdays.length > 0) {
          for (const date of importHolidayDto.workdays) {
            await this.holidayModel.create(
              {
                id: date,
                desc: importHolidayDto.desc + '调休',
                isHoliday: false,
                last: null,
              },
              transactionHost,
            );
          }
        }
      });
    } else {
      throw new Error('参数有误');
    }
  }

  async isHoliday(date?: number): Promise<{
    isHoliday: boolean;
    desc: string;
    date?: string;
  }> {
    let day = dayjs().tz('PRC');
    if (date != null) {
      day = dayjs(date.toString(), 'YYYYMMDD');
    } else {
      date = parseInt(day.format('YYYYMMDD'));
    }
    const result = await this.holidayModel.findByPk(date);
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
  }

  async getHolidayICS(): Promise<string> {
    try {
      const list = await this.holidayModel.findAll({
        attributes: ['id', 'desc', 'last'],
        order: ['id'],
      });
      const tmp = list.map((item) => {
        return item.get({ plain: true });
      });
      let ics =
        'BEGIN:VCALENDAR\r\n' +
        'VERSION:2.0\r\n' +
        'X-WR-CALNAME:中国节假日调休日历\r\n';
      let tmpEvent = undefined;
      let tmpDate = undefined;
      for (const day of tmp) {
        if (
          !tmpEvent ||
          !tmpEvent.last ||
          dayjs(day.id.toString(), 'YYYYMMDD').diff(tmpDate, 'day') >=
            tmpEvent.last
        ) {
          tmpEvent = day;
          ics += 'BEGIN:VEVENT\r\n';
          ics += `SUMMARY:${day.desc}\r\n`;
          tmpDate = dayjs(day.id.toString(), 'YYYYMMDD');
          if (day.last) {
            ics += `DTSTART;VALUE=DATE:${tmpDate.format('YYYYMMDD')}\r\n`;
            ics += `DTEND;VALUE=DATE:${tmpDate
              .add(day.last, 'day')
              .format('YYYYMMDD')}\r\n`;
          } else {
            ics += `DTSTART;VALUE=DATE:${tmpDate.format('YYYYMMDD')}\r\n`;
            ics += `DTEND;VALUE=DATE:${tmpDate
              .add(1, 'day')
              .format('YYYYMMDD')}\r\n`;
          }
          ics += 'END:VEVENT\r\n';
        }
      }
      ics += 'END:VCALENDAR\r\n';
      return ics;
    } catch (e) {
      return '';
    }
  }
}

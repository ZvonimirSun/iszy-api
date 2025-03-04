import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { Holiday } from '~entities/holiday/holiday.model'
import { HolidayController } from './holiday.controller'
import { HolidayService } from './holiday.service'

@Module({
  imports: [SequelizeModule.forFeature([Holiday])],
  controllers: [HolidayController],
  providers: [HolidayService],
  exports: [HolidayService],
})
export class HolidayModule {}

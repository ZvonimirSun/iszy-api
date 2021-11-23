import { Module } from '@nestjs/common';
import { TronController } from './tron.controller';
import { TronService } from './tron.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { TronModel } from './entities/tron.model';

@Module({
  imports: [SequelizeModule.forFeature([TronModel])],
  controllers: [TronController],
  providers: [TronService],
  exports: [TronService],
})
export class TronModule {}

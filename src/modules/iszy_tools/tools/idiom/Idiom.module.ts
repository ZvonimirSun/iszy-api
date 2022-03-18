import { SequelizeModule } from '@nestjs/sequelize';
import { Module } from '@nestjs/common';
import { IdiomController } from './Idiom.controller';
import { IdiomService } from './Idiom.service';
import { IdiomHandle } from './entities/IdiomHandle.model';
import { Idiom } from './entities/Idiom.model';

@Module({
  imports: [SequelizeModule.forFeature([IdiomHandle, Idiom])],
  controllers: [IdiomController],
  providers: [IdiomService],
  exports: [IdiomService],
})
export class IdiomModule {}

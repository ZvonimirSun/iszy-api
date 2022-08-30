import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JsoneditorModel } from './entities/jsoneditor.model';
import { JsoneditorService } from './jsoneditor.service';
import { JsoneditorController } from './jsoneditor.controller';

@Module({
  imports: [SequelizeModule.forFeature([JsoneditorModel])],
  controllers: [JsoneditorController],
  providers: [JsoneditorService],
  exports: [JsoneditorService],
})
export class JsoneditorModule {}

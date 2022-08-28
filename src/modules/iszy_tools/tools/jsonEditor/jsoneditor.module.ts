import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JsoneditorModel } from './entities/jsoneditor.model';
import { JsoneditorService } from './jsoneditor.service';

@Module({
  imports: [SequelizeModule.forFeature([JsoneditorModel])],
  providers: [JsoneditorService],
  exports: [JsoneditorService],
})
export class JsoneditorModule {}

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { JsoneditorService } from './jsoneditor.service'
import { JsoneditorController } from './jsoneditor.controller'
import { JsoneditorModel } from '~entities/jsonEditor/jsoneditor.model'

@Module({
  imports: [SequelizeModule.forFeature([JsoneditorModel])],
  controllers: [JsoneditorController],
  providers: [JsoneditorService],
  exports: [JsoneditorService],
})
export class JsoneditorModule {}

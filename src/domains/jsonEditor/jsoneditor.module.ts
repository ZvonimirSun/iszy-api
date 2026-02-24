import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { JsoneditorModel } from './entities/jsoneditor.model'
import { JsoneditorController } from './jsoneditor.controller'
import { JsoneditorService } from './jsoneditor.service'

@Module({
  imports: [SequelizeModule.forFeature([JsoneditorModel])],
  controllers: [JsoneditorController],
  providers: [JsoneditorService],
})
export class JsoneditorModule {}

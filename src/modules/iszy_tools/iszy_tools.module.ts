import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { Settings } from '~entities/iszy_tools/settings.model'
import { IdiomModule } from '~modules/idiom/Idiom.module'
import { JsoneditorModule } from '~modules/jsonEditor/jsoneditor.module'
import { IszyToolsController } from './iszy_tools.controller'
import { IszyToolsService } from './iszy_tools.service'

@Module({
  imports: [
    SequelizeModule.forFeature([Settings]),
    IdiomModule,
    JsoneditorModule,
  ],
  controllers: [IszyToolsController],
  providers: [IszyToolsService],
})
export class IszyToolsModule {}

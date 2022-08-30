import { SequelizeModule } from '@nestjs/sequelize';
import { Module } from '@nestjs/common';
import { IszyToolsController } from './iszy_tools.controller';
import { IszyToolsService } from './iszy_tools.service';
import { Settings } from './entities/settings.model';
import { IdiomModule } from './modules/idiom/Idiom.module';
import { JsoneditorModule } from './modules/jsonEditor/jsoneditor.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Settings]),
    IdiomModule,
    JsoneditorModule,
  ],
  controllers: [IszyToolsController],
  providers: [IszyToolsService],
  exports: [IszyToolsService],
})
export class IszyToolsModule {}

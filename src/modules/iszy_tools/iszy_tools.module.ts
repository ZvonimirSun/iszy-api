import { SequelizeModule } from '@nestjs/sequelize';
import { Module } from '@nestjs/common';
import { IszyToolsController } from './iszy_tools.controller';
import { IszyToolsService } from './iszy_tools.service';
import { Settings } from './entities/settings.model';

@Module({
  imports: [SequelizeModule.forFeature([Settings])],
  controllers: [IszyToolsController],
  providers: [IszyToolsService],
  exports: [IszyToolsService],
})
export class IszyToolsModule {}

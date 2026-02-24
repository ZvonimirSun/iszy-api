import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { Settings } from './entities/settings.model'
import { IszyToolsController } from './iszy_tools.controller'
import { IszyToolsService } from './iszy_tools.service'

@Module({
  imports: [
    SequelizeModule.forFeature([Settings]),
  ],
  controllers: [IszyToolsController],
  providers: [IszyToolsService],
})
export class IszyToolsModule {}

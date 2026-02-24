import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { LogModel } from './entities/log.model'
import { OptionsModel } from './entities/options.model'
import { UrlModel } from './entities/url.model'
import { UrlsController } from './urls.controller'
import { UrlsService } from './urls.service'

@Module({
  imports: [SequelizeModule.forFeature([UrlModel, OptionsModel, LogModel])],
  controllers: [UrlsController],
  providers: [UrlsService],
})
export class UrlsModule {}

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { LogModel } from '~entities/urls/log.model'
import { OptionsModel } from '~entities/urls/options.model'
import { UrlModel } from '~entities/urls/url.model'
import { UrlsController } from './urls.controller'
import { UrlsService } from './urls.service'

@Module({
  imports: [SequelizeModule.forFeature([UrlModel, OptionsModel, LogModel])],
  providers: [UrlsService],
  exports: [UrlsService],
  controllers: [UrlsController],
})
export class UrlsModule {}

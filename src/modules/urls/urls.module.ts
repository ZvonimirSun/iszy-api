import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { UrlsService } from './urls.service'
import { UrlsController } from './urls.controller'
import { UrlModel } from '~entities/urls/url.model'
import { OptionsModel } from '~entities/urls/options.model'
import { LogModel } from '~entities/urls/log.model'

@Module({
  imports: [SequelizeModule.forFeature([UrlModel, OptionsModel, LogModel])],
  providers: [UrlsService],
  exports: [UrlsService],
  controllers: [UrlsController],
})
export class UrlsModule {}

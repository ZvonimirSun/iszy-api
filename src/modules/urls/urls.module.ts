import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UrlModel } from './entities/url.model';
import { UrlsService } from './urls.service';
import { OptionsModel } from './entities/options.model';
import { LogModel } from './entities/log.model';
import { UrlsController } from './urls.controller';

@Module({
  imports: [SequelizeModule.forFeature([UrlModel, OptionsModel, LogModel])],
  providers: [UrlsService],
  exports: [UrlsService],
  controllers: [UrlsController],
})
export class UrlsModule {}

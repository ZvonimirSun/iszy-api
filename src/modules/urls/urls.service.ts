import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { UrlModel } from './entities/url.model';
import { OptionsModel } from './entities/options.model';
import { LogModel } from './entities/log.model';

@Injectable()
export class UrlsService {
  constructor(
    @InjectModel(UrlModel) private urlModel: typeof UrlModel,
    @InjectModel(OptionsModel) private optionsModel: typeof OptionsModel,
    @InjectModel(LogModel) private logModel: typeof LogModel,
    private sequelize: Sequelize,
  ) {}
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JsoneditorModel } from './entities/jsoneditor.model';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class JsoneditorService {
  constructor(
    @InjectModel(JsoneditorModel)
    private jsoneditorModel: typeof JsoneditorModel,
    private sequelize: Sequelize,
  ) {}

  private readonly logger = new Logger(JsoneditorService.name);
}

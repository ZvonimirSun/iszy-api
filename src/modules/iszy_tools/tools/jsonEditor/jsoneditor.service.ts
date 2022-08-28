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

  async getList(): Promise<JsoneditorModel[]> {
    try {
      return await this.jsoneditorModel.findAll({
        raw: true,
      });
    } catch (e) {
      this.logger.error(e);
      return [];
    }
  }

  async updateItem(
    userId: string,
    key: string,
    name: string,
    text: string,
    json: any,
  ): Promise<boolean> {
    try {
      await this.sequelize.transaction(async (t) => {
        const data = await this.jsoneditorModel.findByPk(key);
        if (data) {
          await data.update(
            {
              name,
              text,
              json,
            },
            {
              transaction: t,
            },
          );
        } else {
          await this.jsoneditorModel.create(
            {
              key,
              name,
              text,
              json,
            },
            {
              transaction: t,
            },
          );
        }
      });
      return true;
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }
}

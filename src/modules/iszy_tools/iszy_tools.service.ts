import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Settings } from './entities/settings.model';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';

@Injectable()
export class IszyToolsService {
  constructor(
    @InjectModel(Settings) private settingModel: typeof Settings,
    private sequelize: Sequelize,
  ) {}

  private readonly logger = new Logger(IszyToolsService.name);

  async uploadSettings(userId: number, settingDto: any, key?: string) {
    if (settingDto != null && Object.keys(settingDto).length > 0) {
      try {
        const result = await this.sequelize.transaction(async (t) => {
          const transactionHost = { transaction: t };
          const setting = await this.settingModel.findOne({
            where: { userId, key: key ? key : { [Op.eq]: null } },
            transaction: t,
          });
          let tmp: Settings;
          if (setting) {
            tmp = await setting[0].update(
              { settings: settingDto },
              transactionHost,
            );
          } else {
            tmp = await this.settingModel.create(
              {
                userId,
                key,
                settings: settingDto,
              },
              transactionHost,
            );
          }
          return tmp;
        });
        if (result) {
          return result.get({ plain: true }).settings;
        }
      } catch (e) {
        this.logger.error(e);
      }
    }
    return null;
  }

  async downloadSettings(userId: number) {
    try {
      const setting = await this.settingModel.findAll({
        where: {
          userId,
        },
      });
      const result = {};
      let tmp: any;
      let flag = true;
      for (const item of setting) {
        if (item.key) {
          result[item.key] = item.settings;
          flag = false;
        } else {
          tmp = item.settings;
        }
      }
      if (flag) {
        return tmp;
      } else {
        return result;
      }
    } catch (e) {
      this.logger.error(e);
    }
    return null;
  }
}

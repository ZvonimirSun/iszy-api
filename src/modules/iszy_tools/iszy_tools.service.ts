import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Settings } from './entities/settings.model';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class IszyToolsService {
  constructor(
    @InjectModel(Settings) private settingModel: typeof Settings,
    private sequelize: Sequelize,
  ) {}

  private readonly logger = new Logger(IszyToolsService.name);

  async uploadSettings(userId: number, settingDto: any) {
    if (settingDto != null && Object.keys(settingDto).length > 0) {
      try {
        let result;
        await this.sequelize.transaction(async (t) => {
          const transactionHost = { transaction: t };
          const setting = await this.settingModel.findByPk(userId);
          if (setting) {
            result = await setting.update(
              { settings: settingDto },
              transactionHost,
            );
          } else {
            result = await this.settingModel.create(
              {
                userId,
                settings: settingDto,
              },
              transactionHost,
            );
          }
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
      const setting = await this.settingModel.findByPk(userId, { raw: true });
      return setting.settings;
    } catch (e) {
      this.logger.error(e);
    }
    return null;
  }
}

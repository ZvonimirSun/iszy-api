import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { Settings } from '~entities/iszy_tools/settings.model'

@Injectable()
export class IszyToolsService {
  constructor(
    @InjectModel(Settings) private settingModel: typeof Settings,
    private sequelize: Sequelize,
  ) {}

  private readonly logger = new Logger(IszyToolsService.name)

  async uploadSettings(userId: number, settingDto: any, key?: string) {
    if (settingDto != null && Object.keys(settingDto).length > 0) {
      try {
        const result = await this.sequelize.transaction(async (t) => {
          const transactionHost = { transaction: t }
          const setting = await this.settingModel.findOne({
            where: { userId, key: key || { [Op.eq]: null } },
            transaction: t,
          })
          let tmp: Settings
          if (setting) {
            tmp = await setting.update(
              { settings: settingDto },
              transactionHost,
            )
          }
          else {
            tmp = await this.settingModel.create(
              {
                userId,
                key,
                settings: settingDto,
              },
              transactionHost,
            )
          }
          return tmp
        })
        if (result)
          return result.get({ plain: true }).settings
      }
      catch (e) {
        this.logger.error(e)
      }
    }
    return null
  }

  async downloadSettings(userId: number, key?: string) {
    try {
      const setting = await this.settingModel.findOne({
        where: {
          userId,
          key: key || { [Op.eq]: null },
        },
      })
      if (setting)
        return setting.get({ plain: true }).settings
      else
        return null
    }
    catch (e) {
      this.logger.error(e)
    }
    return null
  }
}

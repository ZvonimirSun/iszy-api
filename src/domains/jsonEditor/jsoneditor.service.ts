import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Sequelize } from 'sequelize-typescript'
import { Logger } from '~shared'
import { JsoneditorModel } from './entities/jsoneditor.model'

@Injectable()
export class JsoneditorService {
  constructor(
    @InjectModel(JsoneditorModel)
    private jsoneditorModel: typeof JsoneditorModel,
    private sequelize: Sequelize,
  ) {}

  private readonly logger = new Logger(JsoneditorService.name)

  async getList(userId: number): Promise<JsoneditorModel[]> {
    try {
      return await this.jsoneditorModel.findAll({
        where: {
          userId,
        },
        raw: true,
      })
    }
    catch (e) {
      this.logger.error(e, 'JSON 编辑器列表获取失败', { userId })
      return []
    }
  }

  async updateItem(
    userId: number,
    key: string,
    name: string,
    text: string,
    json: any,
  ): Promise<boolean> {
    if (!(name != null || text != null || json != null)) {
      this.logger.debug('JSON 编辑器记录未更新：没有可更新内容', { userId, key })
      return false
    }
    try {
      await this.sequelize.transaction(async (t) => {
        const data = await this.jsoneditorModel.findByPk(key)
        if (data) {
          if (data.userId !== userId)
            return

          const updateData: { name?: string, text?: string, json?: string }
            = {}
          if (name != null)
            updateData.name = name

          if (text != null) {
            updateData.text = text
            updateData.json = null
          }
          else if (json != null) {
            updateData.json = json
            updateData.text = null
          }
          await data.update(updateData, {
            transaction: t,
          })
        }
        else {
          await this.jsoneditorModel.create(
            {
              key,
              name,
              text,
              json,
              userId,
            },
            {
              transaction: t,
            },
          )
        }
      })
      return true
    }
    catch (e) {
      this.logger.error(e, 'JSON 编辑器记录保存失败', { userId, key })
      return false
    }
  }

  async deleteItem(userId: number, key: string): Promise<boolean> {
    try {
      await this.sequelize.transaction(async (t) => {
        const data = await this.jsoneditorModel.findByPk(key)
        if (data && data.userId === userId) {
          await data.destroy({
            transaction: t,
          })
        }
      })
      return true
    }
    catch (e) {
      this.logger.error(e, 'JSON 编辑器记录删除失败', { userId, key })
      return false
    }
  }
}

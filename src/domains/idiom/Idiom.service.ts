import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import dayjs from 'dayjs'
import { Sequelize } from 'sequelize-typescript'
import { Logger } from '~shared'
import { Idiom } from './entities/Idiom.model'
import { IdiomHandle } from './entities/IdiomHandle.model'

@Injectable()
export class IdiomService {
  constructor(
    @InjectModel(IdiomHandle) private idiomHandleModel: typeof IdiomHandle,
    @InjectModel(Idiom) private idiomModel: typeof Idiom,
    private sequelize: Sequelize,
  ) {}

  private readonly logger = new Logger(IdiomService.name)

  async getIdiomHandle() {
    try {
      const date = Number.parseInt(dayjs().format('YYYYMMDD'))
      const result = await this.idiomHandleModel.findByPk(date, {
        plain: true,
      })
      if (result) {
        return result.idiom
      }
      else {
        const idiom = (
          await this.idiomModel.findOne({
            attributes: ['word'],
            where: this.sequelize.where(
              this.sequelize.fn('length', this.sequelize.col('word')),
              4,
            ),
            order: this.sequelize.random(),
          })
        ).get({
          plain: true,
        }).word
        if (idiom) {
          await this.sequelize.transaction(async (t) => {
            const transactionHost = { transaction: t }
            await this.idiomHandleModel.create(
              {
                date,
                idiom,
              },
              transactionHost,
            )
          })
          return idiom
        }
        else {
          return null
        }
      }
    }
    catch (e) {
      this.logger.error(e.message)
      throw new Error(e.message)
    }
  }
}

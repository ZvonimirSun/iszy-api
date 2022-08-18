import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { UrlModel } from './entities/url.model';
import { OptionsModel } from './entities/options.model';
import { LogModel } from './entities/log.model';
import { Request } from 'express';

export enum OPTIONS {
  NEXT_KEYWORD = 'nextKeyword',
}

@Injectable()
export class UrlsService {
  constructor(
    @InjectModel(UrlModel) private urlModel: typeof UrlModel,
    @InjectModel(OptionsModel) private optionsModel: typeof OptionsModel,
    @InjectModel(LogModel) private logModel: typeof LogModel,
    private sequelize: Sequelize,
  ) {}

  private readonly logger = new Logger(UrlsService.name);

  async getUrl(keyword: string): Promise<string> {
    try {
      const data = await this.urlModel.findByPk(keyword, { raw: true });
      return data.url;
    } catch (e) {
      this.logger.error(e);
    }
    return null;
  }

  async createUrl(
    req: Request,
    url: string,
    title?: string,
    keyword?: string,
  ): Promise<boolean> {
    try {
      let key = keyword;
      if (!keyword) {
        key = await this._getNextKeyword();
      }
      await this.sequelize.transaction(async (t) => {
        await this.urlModel.create(
          {
            keyword: key,
            url,
            title,
            ip: req.ip,
          },
          { transaction: t },
        );
      });
      return true;
    } catch (e) {
      this.logger.error(e);
    }
    return false;
  }

  async readUrl(keyword: string): Promise<UrlModel> {
    return await this.urlModel.findByPk(keyword);
  }

  async updateUrl(
    keyword: string,
    url?: string,
    title?: string,
  ): Promise<boolean> {
    if (!keyword || !(url != null || title != null)) {
      return false;
    }
    const options = { keyword, url: undefined, title: undefined };
    if (url != null) {
      options.url = url;
    }
    if (title != null) {
      options.title = title;
    }
    const data = await this.urlModel.findByPk(keyword);
    if (!data) {
      return false;
    }
    try {
      await this.sequelize.transaction(async (t) => {
        await data.update(options, { transaction: t });
      });
      return true;
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }

  async deleteUrl(keyword: string): Promise<boolean> {
    if (!keyword) {
      return false;
    }
    const data = await this.urlModel.findByPk(keyword);
    if (data) {
      try {
        await this.sequelize.transaction(async (t) => {
          await data.destroy({ transaction: t });
        });
        setImmediate(() => {
          this._clearLog(keyword);
        });
        return true;
      } catch (e) {
        this.logger.log(e);
        return false;
      }
    } else {
      return false;
    }
  }

  async visitUrl(keyword: string, req: Request): Promise<string> {
    const url = await this.getUrl(keyword);
    if (url) {
      setImmediate(async () => {
        try {
          await this.sequelize.transaction(async (t) => {
            const transactionHost = { transaction: t };
            const data = await this.urlModel.findByPk(keyword);
            await data.update(
              {
                clicks: data.clicks !== null ? data.clicks + 1 : 1,
              },
              transactionHost,
            );
            await this.logModel.create(
              {
                shortUrl: data.keyword,
                referrer: req.get('Referrer') || 'direct',
                user_agent: req.get('user-agent'),
                ip: req.ip,
              },
              transactionHost,
            );
          });
        } catch (e) {
          this.logger.error(e);
        }
      });
    }
    return url;
  }

  async getUrlList(
    pageIndex = 0,
    pageSize = 10,
  ): Promise<{
    rows: UrlModel[];
    count: number;
    pageSize: number;
    pageIndex: number;
  }> {
    try {
      const { rows, count } = await this.urlModel.findAndCountAll({
        attributes: ['keyword', 'url', 'title', 'createdAt', 'updatedAt'],
        order: [['createdAt', 'desc']],
        limit: pageSize,
        offset: pageIndex * pageSize,
        raw: true,
      });
      return {
        count,
        rows,
        pageSize,
        pageIndex,
      };
    } catch (e) {
      this.logger.error(e);
    }
    return null;
  }

  async _getNextKeyword(): Promise<string> {
    const data = await this.optionsModel.findOne({
      where: {
        key: OPTIONS.NEXT_KEYWORD,
      },
      raw: true,
    });
    let flag = true;

    let keyword = data ? data.value : '0';
    while (flag) {
      const tmp = await this.urlModel.findByPk(keyword);
      if (tmp) {
        keyword = this._computeNextKeyword(keyword);
      } else {
        flag = false;
      }
    }

    setImmediate(() => {
      this._setNextKeyword(this._computeNextKeyword(keyword));
    });

    return keyword;
  }

  async _setNextKeyword(keyword: string): Promise<boolean> {
    try {
      await this.sequelize.transaction(async (t) => {
        const data = await this.optionsModel.findOne({
          where: {
            key: OPTIONS.NEXT_KEYWORD,
          },
          transaction: t,
        });
        if (data) {
          await data.update(
            {
              value: keyword,
            },
            { transaction: t },
          );
        } else {
          await this.optionsModel.create({
            key: OPTIONS.NEXT_KEYWORD,
            value: keyword,
          });
        }
      });
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }

  _computeNextKeyword(keyword: string): string {
    if (!keyword) {
      return '0';
    } else {
      const base =
        '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const tmp = keyword.split('');
      const indexList = tmp
        .map((c) => {
          return base.indexOf(c);
        })
        .reverse();
      let i = 0;
      indexList[i]++;
      while (indexList[i] > 61) {
        indexList[i] = 0;
        i++;
        indexList[i]++;
      }
      indexList.reverse();
      let result = '';
      indexList.forEach((index) => {
        result += base[index];
      });
      return result;
    }
  }

  async _clearLog(keyword: string): Promise<boolean> {
    try {
      await this.sequelize.transaction(async (t) => {
        const data = await this.logModel.findAll({
          where: {
            shortUrl: keyword,
          },
          attributes: ['id'],
          raw: true,
          transaction: t,
        });
        if (data) {
          await this.logModel.destroy({
            where: {
              id: data.map((item) => {
                return item.id;
              }),
            },
            transaction: t,
          });
        }
      });
      return true;
    } catch (e) {
      this.logger.log(e);
      return false;
    }
  }
}

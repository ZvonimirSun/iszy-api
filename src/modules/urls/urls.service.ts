import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { UrlModel } from './entities/url.model';
import { OptionsModel } from './entities/options.model';
import { LogModel } from './entities/log.model';
import { PaginationDto } from '../../core/dto/pagination.dto';
import geoip from 'geoip-lite';
import { load } from 'cheerio';
import axios from 'axios';
import { AuthRequest } from '../../core/types/AuthRequest';

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

  private async getUrl(keyword: string): Promise<string> {
    try {
      const data = await this.urlModel.findByPk(keyword, { raw: true });
      return data.url;
    } catch (e) {
      this.logger.error(e);
    }
    return null;
  }

  async createUrl(
    userId: number,
    ip: string,
    url: string,
    keyword?: string,
  ): Promise<void> {
    if (!url) {
      throw new Error('URL不能为空');
    }
    if (keyword === 'admin') {
      throw new Error('禁止使用保留关键字');
    }
    try {
      let key = keyword;
      if (!keyword) {
        key = await this._getNextKeyword();
        if (key === 'admin') {
          key = await this._getNextKeyword();
        }
      }
      const data = await this.sequelize.transaction(async (t) => {
        return await this.urlModel.create(
          {
            keyword: key,
            url,
            title: '',
            ip,
            userId,
          },
          { transaction: t },
        );
      });
      setImmediate(() => {
        this._getUrlTitle(data);
      });
    } catch (e) {
      let message: string;
      if (e.name === 'SequelizeUniqueConstraintError') {
        message = '关键字已存在';
      } else if (e.name === 'SequelizeValidationError') {
        message = '关键字不合法';
      } else {
        message = e.message;
      }
      this.logger.error(message);
      throw new Error(message);
    }
  }

  async readUrl(userId: number, keyword: string): Promise<UrlModel> {
    const res = await this.urlModel.findByPk(keyword);
    if (res?.userId === userId) {
      return res;
    } else {
      return null;
    }
  }

  async updateUrl(userId: number, keyword: string, url: string): Promise<void> {
    if (!keyword || url == null) {
      throw new Error('参数错误');
    }
    const data = await this.urlModel.findByPk(keyword);
    if (!data || data.userId !== userId) {
      throw new Error('关键字不存在');
    }
    try {
      await this.sequelize.transaction(async (t) => {
        await data.update(
          {
            url,
          },
          { transaction: t },
        );
      });
    } catch (e) {
      this.logger.error(e);
      throw new Error(e.message);
    }
  }

  async deleteUrl(userId: number, keyword: string): Promise<void> {
    if (!keyword) {
      throw new Error('参数错误');
    }
    const data = await this.urlModel.findByPk(keyword);
    if (!data || data.userId !== userId) {
      throw new Error('关键字不存在');
    }
    try {
      await this.sequelize.transaction(async (t) => {
        await data.destroy({ transaction: t });
      });
      setImmediate(() => {
        this._clearLog(keyword);
      });
    } catch (e) {
      this.logger.log(e);
      throw new Error(e.message);
    }
  }

  async visitUrl(keyword: string, req: AuthRequest): Promise<string> {
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
            const options = {
              shortUrl: data.keyword,
              referrer: req.get('Referrer') || 'direct',
              user_agent: req.get('user-agent'),
              ip: req.ip,
              code: '',
            };
            try {
              const geo = geoip.lookup(req.ip);
              if (geo.country) {
                options.code = geo.country;
              }
            } catch (e) {}
            await this.logModel.create(options, transactionHost);
          });
        } catch (e) {
          this.logger.error(e);
        }
      });
    }
    return url;
  }

  async getUrlList(
    userId: number,
    pageIndex = 0,
    pageSize = 10,
  ): Promise<PaginationDto<UrlModel>> {
    try {
      const { rows, count } = await this.urlModel.findAndCountAll({
        order: [['createdAt', 'desc']],
        limit: pageSize,
        offset: pageIndex * pageSize,
        raw: true,
        where: {
          userId,
        },
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

  async staticUrl(userId: number, keyword: string): Promise<void> {}

  private async _getNextKeyword(): Promise<string> {
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

  private async _setNextKeyword(keyword: string): Promise<boolean> {
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

  private _computeNextKeyword(keyword: string): string {
    if (!keyword) {
      return '0';
    }

    const base =
      '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const baseLength = base.length;

    const indexList = keyword
      .split('')
      .reverse()
      .map((c) => {
        return base.indexOf(c);
      });
    let carry = true;
    for (let i = 0; i < indexList.length && carry; i++) {
      const sum = (indexList[i] || 0) + 1;
      if (sum >= baseLength) {
        indexList[i] = 0;
      } else {
        indexList[i] = sum;
        carry = false;
      }
    }
    if (carry) {
      indexList.push(0);
    }
    return indexList
      .reverse()
      .map((index) => base[index])
      .join('');
  }
  private async _getUrlTitle(data: UrlModel): Promise<void> {
    try {
      const res = await axios.get(data.url, {
        timeout: 5000,
      });
      if (typeof res.data === 'string') {
        const $ = load(res.data);
        const title = $('title').text();
        await data.update({
          title,
        });
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  private async _clearLog(keyword: string): Promise<boolean> {
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

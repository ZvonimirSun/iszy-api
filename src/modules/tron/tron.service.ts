import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TronWeb from 'tronweb';
import TronGrid from 'trongrid';
import { contractAddresses } from './ContractAddresses';
import { TronModel } from './entities/tron.model';
import { InjectModel } from '@nestjs/sequelize';
import { ResultDto } from '../../core/result.dto';
import { Sequelize } from 'sequelize-typescript';

const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = new HttpProvider('https://api.trongrid.io');
const solidityNode = new HttpProvider('https://api.trongrid.io');
const eventServer = new HttpProvider('https://api.trongrid.io');

@Injectable()
export class TronService {
  private readonly logger = new Logger(TronService.name);
  private readonly apiKey = this.configService.get<string>('tron.apiKey');

  private readonly tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: {
      'TRON-PRO-API-KEY': this.configService.get<string>('tron.apiKey'),
    },
  });

  constructor(
    private configService: ConfigService,
    @InjectModel(TronModel) private tronModel: typeof TronModel,
    private sequelize: Sequelize,
  ) {}

  async createAccount(): Promise<ResultDto> {
    try {
      const tronWeb = new TronWeb({
        fullNode,
        solidityNode,
        eventServer,
      });
      tronWeb.setHeader({
        'TRON-PRO-API-KEY': this.apiKey,
      });
      return {
        code: '00000',
        data: await tronWeb.createAccount(),
        message: '创建成功',
      };
    } catch (e) {
      this.logger.error(e.message);
      return {
        code: 'B0100',
        message: '创建失败',
      };
    }
  }

  async getBalance(
    address: string,
    contractAddress: string,
  ): Promise<ResultDto> {
    try {
      this.tronWeb.setAddress(address);
      const contract = await this.tronWeb
        .contract()
        .at(contractAddresses[contractAddress.toUpperCase()]);
      const decimals = await contract.decimals().call();
      const res = await contract.balanceOf(address).call();
      return {
        code: '00000',
        data: res.toNumber() / 10 ** decimals,
        message: '查询成功',
      };
    } catch (e) {
      this.logger.error(e.message);
      return {
        code: 'B0100',
        message: '查询失败',
      };
    }
  }

  async getTransactions(
    address: string,
    contractAddress: string,
    fingerprint?: string,
    limit?: number,
  ): Promise<ResultDto> {
    try {
      const tronGrid = new TronGrid(this.tronWeb);
      const {
        data,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        meta: { links, ...others },
      } = await tronGrid.account.getTrc20Transactions(address, {
        contract_address: contractAddresses[contractAddress.toUpperCase()],
        fingerprint,
        limit: limit || 20,
      });
      return {
        code: '00000',
        data: {
          transactions: data,
          ...others,
        },
        message: '查询成功',
      };
    } catch (e) {
      this.logger.error(e.message);
      return {
        code: 'B0100',
        message: '查询失败',
      };
    }
  }

  async addressToHex(address: string): Promise<ResultDto> {
    try {
      return {
        code: '00000',
        data: this.tronWeb.address.toHex(address),
        message: '转换成功',
      };
    } catch (e) {
      this.logger.error(e.message);
      return {
        code: 'B0100',
        message: '转换失败',
      };
    }
  }

  async addressToBase58(address: string): Promise<ResultDto> {
    try {
      return {
        code: '00000',
        data: this.tronWeb.address.fromHex(address),
        message: '转换成功',
      };
    } catch (e) {
      this.logger.error(e.message);
      return {
        code: 'B0100',
        message: '转换失败',
      };
    }
  }

  async addressFromPrivateKey(key: string): Promise<ResultDto> {
    try {
      return {
        code: '00000',
        data: this.tronWeb.address.fromPrivateKey(key),
        message: '转换成功',
      };
    } catch (e) {
      this.logger.error(e.message);
      return {
        code: 'B0100',
        message: '转换失败',
      };
    }
  }

  async addAccount(userId: number, key: string): Promise<ResultDto> {
    try {
      await this.sequelize.transaction(async (transaction) => {
        await this.tronModel.create(
          {
            userId,
            address: this.tronWeb.address.fromPrivateKey(key),
            pk: key,
          },
          { transaction },
        );
      });
      return {
        code: '00000',
        message: '保存成功',
      };
    } catch (e) {
      this.logger.error(e.message);
      return {
        code: 'B0100',
        message: '保存失败',
      };
    }
  }

  async getAddress(userId: number): Promise<ResultDto> {
    try {
      const res = await this.tronModel.findAll({
        where: {
          userId,
        },
        raw: true,
      });
      if (res) {
        return {
          code: '00000',
          data: res.map((item) => item.address),
          message: '获取成功',
        };
      } else {
        return {
          code: '00000',
          data: [],
          message: '获取成功',
        };
      }
    } catch (e) {
      this.logger.error(e.message);
      return {
        code: 'B0100',
        message: e.message,
      };
    }
  }

  async removeAccount(userId: number, key: string): Promise<ResultDto> {
    try {
      await this.sequelize.transaction(async (transaction) => {
        const res = await this.tronModel.findOne({
          where: {
            userId,
            pk: key,
          },
        });
        if (res) {
          await res.destroy({ transaction });
        }
      });
      return {
        code: '00000',
        message: '删除成功',
      };
    } catch (e) {
      this.logger.error(e.message);
      return {
        code: 'B0100',
        message: e.message,
      };
    }
  }
}

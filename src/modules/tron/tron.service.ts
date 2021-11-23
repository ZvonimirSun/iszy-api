import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TronWeb from 'tronweb';
import { contractAddresses } from './ContractAddresses';
import { TronModel } from './entities/tron.model';
import { InjectModel } from '@nestjs/sequelize';
import { ResultDto } from '../../core/result.dto';

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
      this.logger.error(e);
      return {
        code: 'B0100',
        message: '创建失败',
      };
    }
  }

  async getBalance(
    contractAddress: string,
    address: string,
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
      this.logger.error(e);
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
      this.logger.error(e);
      return {
        code: 'B0100',
        message: '转换失败',
      };
    }
  }

  async addressToBase58(address: string) {
    try {
      return {
        code: '00000',
        data: this.tronWeb.address.fromHex(address),
        message: '转换成功',
      };
    } catch (e) {
      this.logger.error(e);
      return {
        code: 'B0100',
        message: '转换失败',
      };
    }
  }

  async addressFromPrivateKey(key: string) {
    try {
      return {
        code: '00000',
        data: this.tronWeb.address.fromPrivateKey(key),
        message: '转换成功',
      };
    } catch (e) {
      this.logger.error(e);
      return {
        code: 'B0100',
        message: '转换失败',
      };
    }
  }

  async addAccount(userId: number, key: string) {
    try {
      await this.tronModel.create({
        userId,
        address: this.tronWeb.address.fromPrivateKey(key),
        pk: key,
      });
      return {
        code: '00000',
        message: '保存成功',
      };
    } catch (e) {
      this.logger.error(e);
      return {
        code: 'B0100',
        message: '保存失败',
      };
    }
  }
}

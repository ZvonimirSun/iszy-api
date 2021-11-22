import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TronWeb from 'tronweb';
import { contractAddresses } from './ContractAddresses';

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

  constructor(private configService: ConfigService) {}

  async createAccount() {
    try {
      const tronWeb = new TronWeb({
        fullNode,
        solidityNode,
        eventServer,
      });
      tronWeb.setHeader({
        'TRON-PRO-API-KEY': this.apiKey,
      });
      return await tronWeb.createAccount();
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }

  async getBalance(contractAddress: string, address: string) {
    try {
      this.tronWeb.setAddress(address);
      const contract = await this.tronWeb
        .contract()
        .at(contractAddresses[contractAddress.toUpperCase()]);
      const decimals = await contract.decimals().call();
      const res = await contract.balanceOf(address).call();
      return res.toNumber() / 10 ** decimals;
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }

  async addressToHex(address: string) {
    try {
      return this.tronWeb.address.toHex(address);
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }

  async addressToBase58(address: string) {
    try {
      return this.tronWeb.address.fromHex(address);
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }

  async addressFromPrivateKey(key: string) {
    try {
      return this.tronWeb.address.fromPrivateKey(key);
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }
}

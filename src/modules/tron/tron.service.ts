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
      const tronWeb = new TronWeb({
        fullNode,
        solidityNode,
        eventServer,
      });
      tronWeb.setHeader({
        'TRON-PRO-API-KEY': this.apiKey,
      });
      tronWeb.setAddress(address);
      const contract = await tronWeb
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
}

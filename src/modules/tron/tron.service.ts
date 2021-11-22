import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TronWeb from 'tronweb';

const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = new HttpProvider('https://api.trongrid.io');
const solidityNode = new HttpProvider('https://api.trongrid.io');
const eventServer = new HttpProvider('https://api.trongrid.io');

@Injectable()
export class TronService {
  constructor(private configService: ConfigService) {
    this.tronWeb.setAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
  }

  private readonly tronWeb = new TronWeb(
    fullNode,
    solidityNode,
    eventServer,
    this.configService.get<string>('tron.pk'),
  );
  private readonly logger = new Logger(TronService.name);

  async test() {
    const trc20ContractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
    try {
      const contract = await this.tronWeb.contract().at(trc20ContractAddress);
      const result = await contract.decimals().call();
      this.logger.log('result: ' + result);
    } catch (e) {
      this.logger.error('trigger smart contract error: ' + e);
    }
    // console.log(this.configService.get<string>('tron.pk'));
    return null;
  }

  async createAccount() {
    return await this.tronWeb.createAccount();
  }
}

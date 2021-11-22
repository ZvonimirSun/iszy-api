import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { TronService } from './tron.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResultDto } from '../../core/result.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Tron')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tron')
export class TronController {
  constructor(private readonly tronService: TronService) {}

  @Post('createAccount')
  async createAccount(): Promise<ResultDto> {
    const res = await this.tronService.createAccount();
    return {
      code: res != null ? '00000' : 'B0100',
      data: res,
      message: res != null ? '创建成功' : '创建失败',
    };
  }

  @Get('getBalance/:contract/:address')
  async getBalance(
    @Param('contract') contract: string,
    @Param('address') address: string,
  ): Promise<ResultDto> {
    const res = await this.tronService.getBalance(contract, address);
    return {
      code: res != null ? '00000' : 'B0100',
      data: res,
      message: res != null ? '查询成功' : '查询失败',
    };
  }

  @Get('addressToHex/:address')
  async addressToHex(@Param('address') address: string): Promise<ResultDto> {
    const res = await this.tronService.addressToHex(address);
    return {
      code: res != null ? '00000' : 'B0100',
      data: res,
      message: res != null ? '转换成功' : '转换失败',
    };
  }

  @Get('addressToBase58/:address')
  async addressToBase58(@Param('address') address: string): Promise<ResultDto> {
    const res = await this.tronService.addressToBase58(address);
    return {
      code: res != null ? '00000' : 'B0100',
      data: res,
      message: res != null ? '转换成功' : '转换失败',
    };
  }

  @Get('addressFromPrivateKey/:key')
  async addressFromPrivateKey(@Param('key') key: string): Promise<ResultDto> {
    const res = await this.tronService.addressFromPrivateKey(key);
    return {
      code: res != null ? '00000' : 'B0100',
      data: res,
      message: res != null ? '转换成功' : '转换失败',
    };
  }
}

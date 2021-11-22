import { Controller, Get, Param, Post } from '@nestjs/common';
import { TronService } from './tron.service';
import { ApiTags } from '@nestjs/swagger';
import { ResultDto } from '../../core/result.dto';

@ApiTags('Tron')
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
}

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TronService } from './tron.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResultDto } from '../../core/result.dto';
import { AuthGuard } from '@nestjs/passport';
import { AddAccountDto } from './dto/add.account.dto';

@ApiTags('Tron')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tron')
export class TronController {
  constructor(private readonly tronService: TronService) {}

  @Post('createAccount')
  async createAccount(): Promise<ResultDto> {
    return await this.tronService.createAccount();
  }

  @Get('getBalance/:contract/:address')
  async getBalance(
    @Param('contract') contract: string,
    @Param('address') address: string,
  ): Promise<ResultDto> {
    return await this.tronService.getBalance(contract, address);
  }

  @Get('addressToHex/:address')
  async addressToHex(@Param('address') address: string): Promise<ResultDto> {
    return await this.tronService.addressToHex(address);
  }

  @Get('addressToBase58/:address')
  async addressToBase58(@Param('address') address: string): Promise<ResultDto> {
    return await this.tronService.addressToBase58(address);
  }

  @Get('addressFromPrivateKey/:key')
  async addressFromPrivateKey(@Param('key') key: string): Promise<ResultDto> {
    return await this.tronService.addressFromPrivateKey(key);
  }

  @Post('addAccount')
  async addAccount(@Request() req, @Body() addAccountDto: AddAccountDto) {
    return await this.tronService.addAccount(req.user.sub, addAccountDto.pk);
  }
}

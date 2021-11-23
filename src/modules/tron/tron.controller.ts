import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TronService } from './tron.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResultDto } from '../../core/result.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiImplicitQuery } from '@nestjs/swagger/dist/decorators/api-implicit-query.decorator';

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

  @Get('getBalance/:address/:contract')
  async getBalance(
    @Param('address') address: string,
    @Param('contract') contract: string,
  ): Promise<ResultDto> {
    return await this.tronService.getBalance(address, contract);
  }

  @ApiImplicitQuery({
    name: 'fingerprint',
    required: false,
  })
  @ApiImplicitQuery({
    name: 'limit',
    required: false,
  })
  @Get('getTransactions/:address/:contract')
  async getTransactions(
    @Param('address') address: string,
    @Param('contract') contract: string,
    @Query('fingerprint') fingerprint?: string,
    @Query('limit') limit?: number,
  ): Promise<ResultDto> {
    return await this.tronService.getTransactions(
      address,
      contract,
      fingerprint,
      limit,
    );
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

  @Post('account/:key')
  async addAccount(@Request() req, @Param('key') key: string) {
    return await this.tronService.addAccount(req.user.sub, key);
  }

  @Delete('account/:key')
  async removeAccount(@Request() req, @Param('key') key: string) {
    return await this.tronService.removeAccount(req.user.sub, key);
  }
}

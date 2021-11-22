import { Controller, Post } from '@nestjs/common';
import { TronService } from './tron.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Tron')
@Controller('tron')
export class TronController {
  constructor(private readonly tronService: TronService) {}

  @Post('test')
  test() {
    return this.tronService.test();
  }

  @Post('createAccount')
  createAccount() {
    return this.tronService.createAccount();
  }
}

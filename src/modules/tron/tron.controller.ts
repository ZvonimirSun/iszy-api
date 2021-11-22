import { Controller, Post } from '@nestjs/common';
import { TronService } from './tron.service';

@Controller('tron')
export class TronController {
  constructor(private readonly tronService: TronService) {}

  @Post('test')
  test() {
    return this.tronService.test();
  }
}

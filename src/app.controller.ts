import { Controller, Get } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Public } from '~shared'

@Public()
@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getHello(): string {
    return `Hello World! ${this.configService.get<string>('app.title')}!`
  }
}

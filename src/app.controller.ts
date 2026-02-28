import { Controller, Get } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AppConfig, Public } from '~shared'

@Public()
@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getHello(): string {
    const appConfig = this.configService.get<AppConfig>('app')
    return `Hello World! ${appConfig.title}!`
  }
}

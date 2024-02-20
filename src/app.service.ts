import { Injectable } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}
  getHello(): string {
    return `Hello World! ${this.configService.get<string>('app.title')}!`
  }
}

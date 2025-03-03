import { Module } from '@nestjs/common'
import { DDNSController } from './ddns.controller'
import { DDNSService } from './ddns.service'

@Module({
  controllers: [DDNSController],
  providers: [DDNSService],
  exports: [DDNSModule],
})
export class DDNSModule {}

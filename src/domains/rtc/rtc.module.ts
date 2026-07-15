import { Module } from '@nestjs/common'
import { RtcSignalingService } from './rtc-signaling.service'
import { RtcController } from './rtc.controller'
import { RtcService } from './rtc.service'

@Module({
  controllers: [RtcController],
  providers: [RtcService, RtcSignalingService],
})
export class RtcModule {}

import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { LinuxdoAuthController } from './linuxdo-auth.controller'
import { LinuxdoAuthService } from './linuxdo-auth.service'
import { LinuxdoStrategy } from './linuxdo.strategy'

@Module({
  imports: [PassportModule],
  controllers: [LinuxdoAuthController],
  providers: [LinuxdoAuthService, LinuxdoStrategy],
})
export class LinuxdoAuthModule {}

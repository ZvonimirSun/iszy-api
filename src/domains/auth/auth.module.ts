import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { JwtConfig } from '~shared'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { DeviceStore } from './store/device-store'
import { TicketStore } from './store/ticket-store'
import { LocalStrategy } from './strategy/local.strategy'

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get<JwtConfig>('auth.jwt').secret,
        }
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    DeviceStore,
    TicketStore,
    LocalStrategy,
  ],
  exports: [AuthService, DeviceStore, TicketStore],
})
export class AuthModule {}

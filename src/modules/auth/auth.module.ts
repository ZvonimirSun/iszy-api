// src/logical/auth/auth.module.ts
import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { UserModule } from '../user/user.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { CustomStrategy } from './strategy/custom.strategy'
import { LocalStrategy } from './strategy/local.strategy'

@Module({
  imports: [PassportModule, UserModule],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, CustomStrategy],
  exports: [AuthService],
})
export class AuthModule {}

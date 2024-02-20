// src/logical/auth/auth.module.ts
import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { UserModule } from '../user/user.module'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { LocalStrategy } from './strategy/local.strategy'
import { CustomStrategy } from './strategy/custom.strategy'

@Module({
  imports: [PassportModule, UserModule],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, CustomStrategy],
  exports: [AuthService],
})
export class AuthModule {}

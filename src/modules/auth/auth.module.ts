// src/logical/auth/auth.module.ts
import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { UserModule } from '../user/user.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { GithubAuthModule } from './children/github/github-auth.module'
import { CustomStrategy } from './custom.strategy'
import { LocalStrategy } from './local.strategy'

@Module({
  imports: [PassportModule, UserModule, GithubAuthModule],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, CustomStrategy],
  exports: [AuthService],
})
export class AuthModule {}

import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiBody, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { User } from '../user/entities/user.model';
import { ResultDto } from '../../core/result.dto';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { CustomAuthGuard } from './guard/custom-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @ApiBody({ type: LoginDto })
  @Post('login')
  async login(@Request() req): Promise<ResultDto<{ token: string }>> {
    return req.user;
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<ResultDto<null>> {
    try {
      await this.authService.register(registerDto);
      return {
        success: true,
        message: '用户创建成功',
      };
    } catch (e) {
      return {
        success: false,
        message: `用户创建失败, ${e.message}`,
      };
    }
  }

  @ApiCookieAuth()
  @UseGuards(CustomAuthGuard)
  @Get('profile')
  async getProfile(@Request() req): Promise<ResultDto<User>> {
    try {
      return {
        success: true,
        data: await this.authService.getProfile(req.user.userName),
        message: '获取成功',
      };
    } catch (e) {
      return {
        success: false,
        message: e.message,
      };
    }
  }
}

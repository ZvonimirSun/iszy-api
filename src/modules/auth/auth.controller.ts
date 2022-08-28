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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../user/entities/user.model';
import { ResultDto } from '../../core/result.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<ResultDto<{ token: string }>> {
    try {
      return {
        success: true,
        data: { token: await this.authService.login(loginDto) },
        message: '登录成功',
      };
    } catch (e) {
      return {
        success: false,
        message: `登录失败, ${e.message}`,
      };
    }
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('token')
  refreshToken(@Request() req): ResultDto<{ token: string }> {
    try {
      const { userName, userId } = req.user;
      return {
        success: true,
        data: {
          token: this.authService.certificate({
            userId,
            userName,
          } as User),
        },
        message: '登录成功',
      };
    } catch (e) {
      return {
        success: false,
        message: `登录失败, ${e.message}`,
      };
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
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

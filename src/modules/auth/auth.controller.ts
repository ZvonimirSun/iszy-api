import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { User } from './modules/user/entities/user.model';
import { ResultDto } from '../../core/result.dto';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { CustomAuthGuard } from './guard/custom-auth.guard';
import { promisify } from 'util';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private readonly logger = new Logger(AuthService.name);

  @UseGuards(LocalAuthGuard)
  @ApiBody({ type: LoginDto })
  @Post('login')
  login(@Request() req): ResultDto<User> {
    this.logger.log(`${req.user.userName} 登陆成功`);
    return {
      success: true,
      message: '登录成功',
      data: req.user,
    };
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

  @UseGuards(CustomAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    try {
      const userName = req.user.userName;
      await promisify(req.logout.bind(req))();
      this.logger.log(`${userName} 登出成功`);
      return {
        success: true,
        message: '登出成功',
      };
    } catch (e) {
      this.logger.error(e);
      return {
        success: false,
        message: '登出失败',
      };
    }
  }
}

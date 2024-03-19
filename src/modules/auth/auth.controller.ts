import { promisify } from 'node:util'
import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBody, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import type { RegisterDto } from './dto/register.dto'
import type { LogoutDto } from './dto/logout.dto'
import { LocalAuthGuard } from '~core/guard/local-auth.guard'
import { CustomAuthGuard } from '~core/guard/custom-auth.guard'
import type { User } from '~entities/user/user.model'
import type { ResultDto } from '~core/dto/result.dto'
import type { AuthRequest } from '~types/AuthRequest'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private readonly logger = new Logger(AuthController.name)

  @UseGuards(LocalAuthGuard)
  @ApiBody({ type: LoginDto })
  @Post('login')
  login(@Req() req: AuthRequest): ResultDto<Partial<User>> {
    this.logger.log(`${req.user.userName} 登陆成功`)
    return {
      success: true,
      message: '登录成功',
      data: req.user,
    }
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<ResultDto<null>> {
    try {
      await this.authService.register(registerDto)
      return {
        success: true,
        message: '用户创建成功',
      }
    }
    catch (e) {
      return {
        success: false,
        message: `用户创建失败, ${e.message}`,
      }
    }
  }

  @UseGuards(CustomAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: AuthRequest): Promise<ResultDto<Partial<User>>> {
    try {
      return {
        success: true,
        data: await this.authService.getProfile(req.user.userName),
        message: '获取成功',
      }
    }
    catch (e) {
      return {
        success: false,
        message: e.message,
      }
    }
  }

  @UseGuards(CustomAuthGuard)
  @Put('profile')
  async updateProfile(
    @Req() req: AuthRequest,
    @Body() updateProfileDto: Partial<User> & { oldPasswd?: string },
  ): Promise<ResultDto<Partial<User>>> {
    try {
      return {
        success: true,
        data: await this.authService.updateProfile(
          req.user.userName,
          updateProfileDto,
        ),
        message: '更新成功',
      }
    }
    catch (e) {
      return {
        success: false,
        message: e.message,
      }
    }
  }

  @UseGuards(CustomAuthGuard)
  @Post('logout')
  async logout(@Req() req: AuthRequest, @Query() logoutDto: LogoutDto) {
    try {
      const userName = req.user.userName
      const userId = req.user.userId
      const session = req.session
      if (logoutDto.all) {
        await promisify(req.logout.bind(req))()
        session.destroy(() => {

        })
        this.authService.logout(userId)
      }
      else if (logoutDto.other) {
        this.authService.logout(userId, session.id)
      }
      else {
        await promisify(req.logout.bind(req))()
        session.destroy(() => {

        })
      }
      this.logger.log(`${userName} 登出成功`)
      return {
        success: true,
        message: '登出成功',
      }
    }
    catch (e) {
      this.logger.error(e)
      return {
        success: false,
        message: '登出失败',
      }
    }
  }
}

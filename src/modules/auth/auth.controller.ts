import type { Response } from 'express'
import type { ResultDto } from '~core/dto/result.dto'
import type { PublicUser } from '~entities/user/user.model'
import type { AuthRequest } from '~types/AuthRequest'
import type { LogoutDto } from './dto/logout.dto'
import type { RegisterDto } from './dto/register.dto'
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
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiBody, ApiTags } from '@nestjs/swagger'
import { Public } from '~core/decorator/public.decorator'
import { AuthGuard } from '~core/guard/custom-auth.guard'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { UpdateProfileDto } from './dto/updateProfile.dto'
import { LocalAuthGuard } from './local-auth.guard'

@ApiTags('Auth')
@UseGuards(AuthGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private readonly logger = new Logger(AuthController.name)

  @UseGuards(LocalAuthGuard)
  @Public()
  @ApiBody({ type: LoginDto })
  @Post('login')
  login(@Req() req: AuthRequest): ResultDto<PublicUser> {
    this.logger.log(`${req.user.userName} 登陆成功`)
    return {
      success: true,
      message: '登录成功',
      data: req.user,
    }
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<ResultDto<void>> {
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

  @Get('profile')
  async getProfile(@Req() req: AuthRequest): Promise<ResultDto<PublicUser>> {
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

  @Put('profile')
  async updateProfile(
    @Req() req: AuthRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ResultDto<PublicUser>> {
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

  @Post('logout')
  async logout(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response, @Query() logoutDto: LogoutDto) {
    try {
      const userName = req.user.userName
      const userId = req.user.userId
      const session = req.session
      if (logoutDto.all) {
        await promisify(req.logout.bind(req))()
        await promisify(req.session.destroy.bind(req.session))()
        this.authService.logout(userId)
      }
      else if (logoutDto.other) {
        this.authService.logout(userId, session.id)
      }
      else {
        await promisify(req.logout.bind(req))()
        await promisify(req.session.destroy.bind(req.session))()
        res.cookie('iszy_api.connect.sid', '', {
          maxAge: 0,
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

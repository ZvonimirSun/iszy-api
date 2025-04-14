import type { Device, PublicUser, ResultDto } from '@zvonimirsun/iszy-common'
import type { AuthRequest } from '~types/AuthRequest'
import type { LogoutDto } from './dto/logout.dto'
import type { RegisterDto } from './dto/register.dto'
import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger'
import { Public, RefreshToken } from '~core/decorator'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { UpdateProfileDto } from './dto/updateProfile.dto'
import { LocalAuthGuard } from './local-auth.guard'

@ApiBearerAuth()
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  private readonly logger = new Logger(AuthController.name)

  @UseGuards(LocalAuthGuard)
  @ApiBody({ type: LoginDto })
  @Post('login')
  async login(@Req() req: AuthRequest): Promise<ResultDto<{
    access_token: string
    refresh_token: string
    profile: PublicUser
  }>> {
    this.logger.log(`${req.user.userName} 登陆成功`)
    return {
      success: true,
      message: '登录成功',
      data: await this.authService.generateToken(req.user, req.device),
    }
  }

  @Post('logout')
  async logout(@Req() req: AuthRequest, @Query() logoutDto: LogoutDto): Promise<ResultDto<void>> {
    try {
      logoutDto.deviceId = logoutDto.deviceId || req.device.id
      await this.authService.logout(req.user.userId, logoutDto)
      this.logger.log(`${req.user.userName} 登出成功`)
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

  @RefreshToken()
  @Post('refresh')
  async refreshToken(
    @Req() req: AuthRequest,
  ): Promise<ResultDto<{
      access_token: string
      refresh_token: string
      profile: PublicUser
    }>> {
    return {
      success: true,
      message: '刷新成功',
      data: await this.authService.generateToken(req.user, req.device),
    }
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<ResultDto<boolean>> {
    try {
      return {
        success: true,
        data: await this.authService.register(registerDto),
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
    return {
      success: true,
      data: await this.authService.getProfile(req.user.userName),
      message: '获取成功',
    }
  }

  @Put('profile')
  async updateProfile(
    @Req() req: AuthRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ResultDto<PublicUser>> {
    return {
      success: true,
      data: await this.authService.updateProfile(
        req.user.userName,
        updateProfileDto,
      ),
      message: '更新成功',
    }
  }

  @Post('bind/:type/:id')
  async bind(
    @Req() req: AuthRequest,
    @Param('type') type: string,
    @Param('id') id: string,
  ): Promise<ResultDto<void>> {
    await this.authService.bind(req.user.userId, type, id)
    return {
      success: true,
      message: '绑定成功',
    }
  }

  @Delete('bind/:type')
  async unbind(
    @Req() req: AuthRequest,
    @Param('type') type: string,
  ): Promise<ResultDto<void>> {
    await this.authService.unbind(req.user.userId, type)
    return {
      success: true,
      message: '解绑成功',
    }
  }

  @Get('devices')
  async getDevices(@Req() req: AuthRequest): Promise<ResultDto<Device[]>> {
    const devices = await this.authService.getDevices(req.user.userId)
    return {
      success: true,
      data: devices.map((device) => {
        if (device.id === req.device.id) {
          device.current = true
        }
        return device
      }),
      message: '获取成功',
    }
  }
}

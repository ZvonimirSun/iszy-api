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
  UseGuards,
} from '@nestjs/common'
import { ApiBody, ApiTags } from '@nestjs/swagger'
import { Public } from '~core/decorator/public.decorator'
import { AuthGuard } from '~core/guard/custom-auth.guard'
import { GithubAuthGuard } from '~core/guard/github-auth.guard'
import { LocalAuthGuard } from '~core/guard/local-auth.guard'
import { UpdateProfileDto } from '~modules/auth/dto/updateProfile.dto'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'

@ApiTags('Auth')
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

  @UseGuards(AuthGuard)
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

  @UseGuards(AuthGuard)
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

  @UseGuards(AuthGuard)
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

  @UseGuards(AuthGuard)
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

  @UseGuards(GithubAuthGuard)
  @Get('github')
  githubLogin() {
    // 自动跳转到 GitHub 授权页面
  }

  @UseGuards(GithubAuthGuard)
  @Get('github/callback')
  githubLoginCallback() {
    return `
      <script>
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'oauth_complete' }, '*');
        }
        window.opener = null;
        window.open('about:blank', '_self');
        window.close();
      </script>
    `
  }
}

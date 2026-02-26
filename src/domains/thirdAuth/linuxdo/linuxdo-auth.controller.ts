import { Controller, Get, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { ResultDto } from '@zvonimirsun/iszy-common'
import { AuthRequest, Logger, Public } from '~shared'
import { LinuxdoAuthGuard } from './linuxdo-auth.guard'
import { LinuxdoAuthService } from './linuxdo-auth.service'

@ApiBearerAuth()
@ApiTags('Auth')
@UseGuards(LinuxdoAuthGuard)
@Controller('auth/linuxdo')
export class LinuxdoAuthController {
  constructor(private linuxdoAuthService: LinuxdoAuthService, private configService: ConfigService) {}

  private readonly logger = new Logger(LinuxdoAuthController.name)

  @Public()
  @Get('callback')
  async loginCallback(@Req() req: AuthRequest) {
    let bodyInfo = ''
    let msgInfo: any
    // 绑定linuxdo
    if (req.isBind) {
      if (!req.user) {
        throw new UnauthorizedException('用户未登录，无法绑定')
      }
      const data = await this.linuxdoAuthService.bind(req.user, req.thirdPartProfile)
      if (data.type === 'bind_success') {
        bodyInfo = '验证成功'
        msgInfo = data
      }
      else {
        bodyInfo = data.data
        msgInfo = data
      }
    }
    // 登录
    else {
      if (req.user || this.configService.get<boolean>('auth.publicRegister')) {
        bodyInfo = '登录完成'
        if (!req.user) {
          // 用户不存在
          req.user = await this.linuxdoAuthService.register(req.thirdPartProfile)
        }
        msgInfo = await this.linuxdoAuthService.login(req.user, req.device)
        this.logger.log(`${req.user.userName}通过 LINUX DO 登录成功`)
      }
      else {
        bodyInfo = '登录失败'
        msgInfo = {
          type: 'oauth_fail',
          data: '登陆失败',
        }
      }
    }
    return `
      <body>
        ${bodyInfo}
        <script>
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(${JSON.stringify(msgInfo)}, '*');
          }
        </script>
      </body>
    `
  }

  @Public()
  @Get()
  login() {
    // 自动跳转到 LINUX DO 授权页面
  }

  @Get('bind')
  bind() {}

  @Post('unbind')
  async unbind(@Req() req: AuthRequest): Promise<ResultDto<void>> {
    await this.linuxdoAuthService.unbind(req.user)
    return {
      success: true,
      message: '解绑成功',
    }
  }
}

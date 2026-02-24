import type { AuthRequest } from '~types/AuthRequest'
import { promisify } from 'node:util'
import { Controller, Get, Logger, Req, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '~core/decorator'
import { LinuxdoAuthGuard } from './linuxdo-auth.guard'
import { LinuxdoAuthService } from './linuxdo-auth.service'

@ApiTags('Auth')
@UseGuards(LinuxdoAuthGuard)
@Controller('auth/linuxdo')
export class LinuxdoAuthController {
  constructor(private linuxdoAuthService: LinuxdoAuthService, private configService: ConfigService) {}

  private readonly logger = new Logger(LinuxdoAuthController.name)

  @Public()
  @Get('callback')
  async linuxdoLoginCallback(@Req() req: AuthRequest) {
    let bodyInfo = ''
    let msgInfo: any
    // 绑定linuxdo
    if (req.session.bindLinuxdo) {
      const data = await this.linuxdoAuthService.bind(req.thirdPartProfile)
      if (data.type === 'bind_success') {
        bodyInfo = '验证成功'
        msgInfo = data
      }
      else {
        bodyInfo = data.data
        msgInfo = data
      }
      await promisify(req.session.destroy.bind(req.session))()
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
  linuxdoLogin() {
    // 自动跳转到 LINUX DO 授权页面
  }

  @Get('bind')
  linuxdoBind() {}
}

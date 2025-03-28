import type { AuthRequest } from '~types/AuthRequest'
import { Controller, Get, Logger, Req, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '~core/decorator'
import { AuthService } from '~modules/core/auth/auth.service'
import { GithubAuthGuard } from './github-auth.guard'
import { GithubAuthService } from './github-auth.service'

@ApiTags('Auth')
@UseGuards(GithubAuthGuard)
@Controller('auth/github')
export class GithubAuthController {
  constructor(private authService: AuthService, private githubAuthService: GithubAuthService) {}

  private readonly logger = new Logger(GithubAuthController.name)

  @Public()
  @Get('callback')
  async githubLoginCallback(@Req() req: AuthRequest) {
    let bodyInfo = ''
    let msgInfo: any
    if (req.session.bindGithub) {
      const data = await this.githubAuthService.bind(req.thirdPartProfile.id)
      if (data.type === 'bind_success') {
        bodyInfo = '验证成功'
        msgInfo = data
      }
      else {
        bodyInfo = data.data
        msgInfo = data
      }
    }
    else {
      this.logger.log('Github登录成功')
      bodyInfo = '登录完成'
      msgInfo = await this.githubAuthService.login(req.user, req.deviceId)
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
  githubLogin() {
    // 自动跳转到 GitHub 授权页面
  }

  @Get('bind')
  githubBind() {}
}

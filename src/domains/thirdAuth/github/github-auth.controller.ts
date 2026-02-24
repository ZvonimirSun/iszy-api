import type { AuthRequest } from '~types/AuthRequest'
import { promisify } from 'node:util'
import { Controller, Get, Logger, Req, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '~core/decorator'
import { GithubAuthGuard } from './github-auth.guard'
import { GithubAuthService } from './github-auth.service'

@ApiTags('Auth')
@UseGuards(GithubAuthGuard)
@Controller('auth/github')
export class GithubAuthController {
  constructor(private githubAuthService: GithubAuthService, private configService: ConfigService) {}

  private readonly logger = new Logger(GithubAuthController.name)

  @Public()
  @Get('callback')
  async githubLoginCallback(@Req() req: AuthRequest) {
    let bodyInfo = ''
    let msgInfo: any
    // 绑定github
    if (req.session.bindGithub) {
      const data = await this.githubAuthService.bind(req.thirdPartProfile)
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
      bodyInfo = '登录完成'
      if (req.user || this.configService.get<boolean>('auth.publicRegister')) {
        if (!req.user) {
          // 用户不存在
          req.user = await this.githubAuthService.register(req.thirdPartProfile)
        }
        msgInfo = await this.githubAuthService.login(req.user, req.device)
        this.logger.log(`${req.user.userName}通过 Github 登录成功`)
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
  githubLogin() {
    // 自动跳转到 GitHub 授权页面
  }

  @Get('bind')
  githubBind() {}
}

import type { AuthRequest } from '~types/AuthRequest'
import { Controller, Get, Logger, Req, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AuthService } from '~modules/core/auth/auth.service'
import { GithubAuthGuard } from './github-auth.guard'

@ApiTags('Auth')
@UseGuards(GithubAuthGuard)
@Controller('auth/github')
export class GithubAuthController {
  constructor(private authService: AuthService) {}

  private readonly logger = new Logger(GithubAuthController.name)

  @Get('callback')
  async githubLoginCallback(@Req() req: AuthRequest) {
    this.logger.log('Github登录成功')
    const data = await this.authService.generateToken(req.user, req.deviceId)
    return `
      <body>
        登录完成
        <script>
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              type: 'oauth_complete',
              data: ${JSON.stringify(data)}
            }, '*');
          }
        </script>
      </body>
    `
  }

  @Get()
  githubLogin() {
    // 自动跳转到 GitHub 授权页面
  }
}

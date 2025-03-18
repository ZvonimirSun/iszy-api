import { Controller, Get, Logger, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GithubAuthGuard } from '~core/guard/github-auth.guard'

@ApiTags('Auth')
@UseGuards(GithubAuthGuard)
@Controller('auth/github')
export class GithubAuthController {
  constructor() {}

  private readonly logger = new Logger(GithubAuthController.name)

  @Get('callback')
  githubLoginCallback() {
    this.logger.log('Github login success callback')
    return `
      <body>
        登录完成
        <script>
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'oauth_complete' }, '*');
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

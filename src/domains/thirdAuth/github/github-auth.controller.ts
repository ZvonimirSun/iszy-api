import type { Response } from 'express'
import { Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { ResultDto } from '@zvonimirsun/iszy-common'
import { TicketStore } from '~domains/auth/store/ticket-store'
import { AuthConfig, AuthRequest, Logger, Public } from '~shared'
import { GithubAuthGuard } from './github-auth.guard'
import { GithubAuthService } from './github-auth.service'

@ApiBearerAuth()
@ApiTags('Auth')
@UseGuards(GithubAuthGuard)
@Controller('auth/github')
export class GithubAuthController {
  constructor(
    private githubAuthService: GithubAuthService,
    private configService: ConfigService,
    private ticketStore: TicketStore,
  ) {}

  private readonly logger = new Logger(GithubAuthController.name)

  @Public()
  @Get('callback')
  async loginCallback(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    let bodyInfo = ''
    let msgInfo: any
    // 绑定github
    if (req.isBind) {
      if (!req.user) {
        throw new UnauthorizedException('用户未登录，无法绑定')
      }
      const data = await this.githubAuthService.bind(req.user, req.thirdPartProfile)
      if (req.oauthCallbackData) {
        const { state, redirect_uri } = req.oauthCallbackData
        res.redirect(302, `${redirect_uri}?state=${state}${data.type !== 'bind_success' ? `&error=${data.data}` : ''}`)
        return
      }
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
      bodyInfo = '登录完成'
      if (req.user || this.configService.get<AuthConfig>('auth').publicRegister) {
        if (!req.user) {
          // 用户不存在
          req.user = await this.githubAuthService.register(req.thirdPartProfile)
        }
        this.logger.log(`${req.user.userName}通过 Github 登录成功`)
        if (req.oauthCallbackData) {
          const { state, redirect_uri } = req.oauthCallbackData
          const ticket = await this.ticketStore.createTicket(req.user.userId)
          res.redirect(302, `${redirect_uri}?state=${state}&code=${ticket}`)
          return
        }
        msgInfo = await this.githubAuthService.login(req.user, req.device)
      }
      else {
        if (req.oauthCallbackData) {
          const { state, redirect_uri } = req.oauthCallbackData
          res.redirect(302, `${redirect_uri}?state=${state}&error=登陆失败`)
          return
        }
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
    // 自动跳转到 GitHub 授权页面
  }

  @Get('bind')
  bind() {}

  @Post('unbind')
  async unbind(@Req() req: AuthRequest): Promise<ResultDto<void>> {
    await this.githubAuthService.unbind(req.user)
    return {
      success: true,
      message: '解绑成功',
    }
  }
}

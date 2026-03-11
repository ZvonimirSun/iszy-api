import type { Response } from 'express'
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { GithubAuthGuard } from '~domains/oauth/guard/github-auth.guard'
import { OauthService } from '~domains/oauth/oauth.service'
import { AuthRequest, Public } from '~shared'

@ApiBearerAuth()
@ApiTags('OAuth')
@UseGuards(GithubAuthGuard)
@Controller('oauth/github')
export class GithubController {
  constructor(
    private oauthService: OauthService,
  ) {}

  @Public()
  @Get('callback')
  async loginCallback(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    return this.oauthService.callbackHandler(req, res, 'github')
  }

  @Public()
  @Get()
  login() {
    // 自动跳转到 GitHub 授权页面
  }

  @Get('bind')
  bind() {}
}

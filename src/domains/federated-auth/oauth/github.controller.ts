import type { Response } from 'express'
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { AuthRequest, Public } from '~shared'
import { GithubAuthGuard } from './guard/github-auth.guard'
import { OauthService } from './oauth.service'

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

import type { Response } from 'express'
import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { ResultDto } from '@zvonimirsun/iszy-common'
import { OauthHelperService } from '~domains/thirdAuth/oauth-helper/oauth-helper.service'
import { AuthRequest, Public } from '~shared'
import { GithubAuthGuard } from './github-auth.guard'
import { GithubAuthService } from './github-auth.service'

@ApiBearerAuth()
@ApiTags('Auth')
@UseGuards(GithubAuthGuard)
@Controller('auth/github')
export class GithubAuthController {
  constructor(
    private githubAuthService: GithubAuthService,
    private oauthService: OauthHelperService,
  ) {}

  @Public()
  @Get('callback')
  async loginCallback(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    return this.oauthService.callbackHandler(req, res, {
      title: 'Github',
      authProvider: this.githubAuthService,
    })
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

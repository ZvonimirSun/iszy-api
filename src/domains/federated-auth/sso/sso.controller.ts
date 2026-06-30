import type { Response } from 'express'
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { AuthRequest, Public } from '~shared'
import { SsoAuthGuard } from './sso-auth.guard'
import { SsoService } from './sso.service'

@ApiBearerAuth()
@ApiTags('OAuth')
@Controller('oauth/sso')
export class SsoController {
  constructor(
    private ssoService: SsoService,
  ) {}

  @Public()
  @UseGuards(SsoAuthGuard)
  @Get('callback')
  async loginCallback(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    return this.ssoService.callbackHandler(req, res)
  }

  @Public()
  @UseGuards(SsoAuthGuard)
  @Get()
  login() {
    // 自动跳转到 SSO 授权页面
  }

  @UseGuards(SsoAuthGuard)
  @Get('bind')
  bind() {}
}

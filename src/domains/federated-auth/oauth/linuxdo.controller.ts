import type { Response } from 'express'
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { AuthRequest, Public } from '~shared'
import { LinuxdoAuthGuard } from './guard/linuxdo-auth.guard'
import { OauthService } from './oauth.service'

@ApiBearerAuth()
@ApiTags('OAuth')
@UseGuards(LinuxdoAuthGuard)
@Controller('oauth/linuxdo')
export class LinuxdoController {
  constructor(
    private oauthService: OauthService,
  ) {}

  @Public()
  @Get('callback')
  async loginCallback(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    return this.oauthService.callbackHandler(req, res, 'linuxdo')
  }

  @Public()
  @Get()
  login() {
    // 自动跳转到 LINUX DO 授权页面
  }

  @Get('bind')
  bind() {}
}

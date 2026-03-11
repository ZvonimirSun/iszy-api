import type { Response } from 'express'
import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { ResultDto } from '@zvonimirsun/iszy-common'
import { OauthHelperService } from '~domains/thirdAuth/oauth-helper/oauth-helper.service'
import { AuthRequest, Public } from '~shared'
import { LinuxdoAuthGuard } from './linuxdo-auth.guard'
import { LinuxdoAuthService } from './linuxdo-auth.service'

@ApiBearerAuth()
@ApiTags('Auth')
@UseGuards(LinuxdoAuthGuard)
@Controller('auth/linuxdo')
export class LinuxdoAuthController {
  constructor(
    private linuxdoAuthService: LinuxdoAuthService,
    private oauthService: OauthHelperService,
  ) {}

  @Public()
  @Get('callback')
  async loginCallback(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    return this.oauthService.callbackHandler(req, res, {
      title: 'LINUX DO',
      authProvider: this.linuxdoAuthService,
    })
  }

  @Public()
  @Get()
  login() {
    // 自动跳转到 LINUX DO 授权页面
  }

  @Get('bind')
  bind() {}

  @Post('unbind')
  async unbind(@Req() req: AuthRequest): Promise<ResultDto<void>> {
    await this.linuxdoAuthService.unbind(req.user)
    return {
      success: true,
      message: '解绑成功',
    }
  }
}

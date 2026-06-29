import type { ResultDto } from '@zvonimirsun/iszy-common'
import type { Response } from 'express'
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { AuthRequest, Public } from '~shared'
import { SsoResolveDto } from './dto/sso-resolve.dto'
import { SsoAuthGuard } from './sso-auth.guard'
import { SsoService } from './sso.service'

@ApiBearerAuth()
@ApiTags('OAuth')
@UseGuards(SsoAuthGuard)
@Controller('oauth/sso')
export class SsoController {
  constructor(
    private ssoService: SsoService,
  ) {}

  @Public()
  @Get('callback')
  async loginCallback(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    return this.ssoService.callbackHandler(req, res)
  }

  @Public()
  @Get()
  login() {
    // 自动跳转到 SSO 授权页面
  }

  @Get('bind')
  bind() {}

  @Public()
  @Post('resolve')
  async resolve(@Body() body: SsoResolveDto): Promise<ResultDto<string>> {
    return {
      success: true,
      message: '处理成功',
      data: await this.ssoService.resolve(body),
    }
  }
}

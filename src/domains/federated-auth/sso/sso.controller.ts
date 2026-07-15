import type { Response } from 'express'
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { LocalAuthGuard } from '~domains/auth/guards/local-auth.guard'
import { AuthRequest, Public } from '~shared'
import {
  SsoBindCompletionDto,
  SsoCompletionDto,
  SsoCreateCompletionDto,
} from './dto/sso-completion.dto'
import { SsoAuthGuard } from './sso-auth.guard'
import { SsoCompletionGuard } from './sso-completion.guard'
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

  @Public()
  @UseGuards(SsoCompletionGuard)
  @Post('completion')
  async getCompletion(@Body() completionDto: SsoCompletionDto) {
    return {
      success: true,
      message: '获取成功',
      data: await this.ssoService.getCompletion(completionDto.pendingToken),
    }
  }

  @Public()
  @UseGuards(SsoCompletionGuard, LocalAuthGuard)
  @Post('completion/bind')
  async completeBind(
    @Req() req: AuthRequest,
    @Body() completionDto: SsoBindCompletionDto,
  ) {
    return {
      success: true,
      message: '绑定并登录成功',
      data: await this.ssoService.completeBind(req, completionDto),
    }
  }

  @Public()
  @UseGuards(SsoCompletionGuard)
  @Post('completion/create')
  async completeCreate(
    @Req() req: AuthRequest,
    @Body() completionDto: SsoCreateCompletionDto,
  ) {
    return {
      success: true,
      message: '创建并登录成功',
      data: await this.ssoService.completeCreate(req, completionDto),
    }
  }
}

import type { PublicUser, ResultDto } from '@zvonimirsun/iszy-common'
import { Body, Controller, Post, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { AuthRequest, ProviderType, TicketOnly } from '~shared'
import { OauthService } from './oauth.service'

@ApiBearerAuth()
@ApiTags('OAuth')
@Controller('oauth')
export class OauthController {
  constructor(
    private readonly oauthService: OauthService,
  ) {}

  @Post('code')
  async getCode(@Req() req: AuthRequest): Promise<ResultDto<string>> {
    return {
      success: true,
      data: await this.oauthService.getCode(req.user),
      message: '生成成功',
    }
  }

  @TicketOnly()
  @Post('token')
  async getToken(@Req() req: AuthRequest): Promise<ResultDto<{
    access_token: string
    refresh_token: string
    profile: PublicUser
  }>> {
    return {
      success: true,
      message: '获取成功',
      data: await this.oauthService.getToken(req.user, req.device),
    }
  }

  @Post('unbind')
  async unbind(@Req() req: AuthRequest, @Body() body: { provider: ProviderType }) {
    await this.oauthService.unbind(req.user, body.provider)
    return {
      success: true,
      message: '解绑成功',
    }
  }
}

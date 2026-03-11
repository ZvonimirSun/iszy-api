import type { PublicUser, ResultDto } from '@zvonimirsun/iszy-common'
import { Controller, Post, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { AuthService } from '~domains/auth/auth.service'
import { TicketStore } from '~domains/auth/store/ticket-store'
import { AuthRequest, TicketOnly } from '~shared'

@ApiBearerAuth()
@ApiTags('OAuth')
@Controller('oauth')
export class OauthController {
  constructor(
    private readonly authService: AuthService,
    private readonly ticketStore: TicketStore,
  ) {}

  @Post('code')
  async getCode(@Req() req: AuthRequest): Promise<ResultDto<string>> {
    return {
      success: true,
      data: await this.ticketStore.createTicket(req.user.userId),
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
      data: await this.authService.generateToken(req.user, req.device),
    }
  }
}

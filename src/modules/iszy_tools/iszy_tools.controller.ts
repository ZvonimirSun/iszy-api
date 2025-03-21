import type { ResultDto } from '~core/dto/result.dto'
import type { AuthRequest } from '~types/AuthRequest'
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IszyToolsService } from './iszy_tools.service'

@ApiBearerAuth()
@ApiTags('ISZY Tools')
@Controller('tools')
export class IszyToolsController {
  constructor(private readonly iszyToolsService: IszyToolsService) {}

  @Post('settings')
  async uploadSettings(
    @Req() req: AuthRequest,
    @Body() settingDto: any,
  ): Promise<ResultDto<any>> {
    const result = await this.iszyToolsService.uploadSettings(
      req.user.userId,
      settingDto,
    )
    return {
      success: true,
      data: result,
      message: result ? '更新成功' : '更新失败',
    }
  }

  @Post('settings/:key')
  async uploadSettingsByKey(
    @Req() req: AuthRequest,
    @Body() settingDto: any,
    @Param('key') key: string,
  ): Promise<ResultDto<any>> {
    const result = await this.iszyToolsService.uploadSettings(
      req.user.userId,
      settingDto,
      key,
    )
    return {
      success: true,
      data: result,
      message: result ? '更新成功' : '更新失败',
    }
  }

  @Get('settings')
  async downloadSettings(@Req() req: AuthRequest) {
    const result = await this.iszyToolsService.downloadSettings(
      req.user.userId,
    )
    return {
      success: true,
      data: result,
      message: result ? '获取成功' : '数据不存在',
    }
  }

  @Get('settings/:key')
  async downloadSettingsByKey(
    @Req() req: AuthRequest,
    @Param('key') key: string,
  ) {
    const result = await this.iszyToolsService.downloadSettings(
      req.user.userId,
      key,
    )
    return {
      success: true,
      data: result,
      message: result ? '获取成功' : '数据不存在',
    }
  }
}

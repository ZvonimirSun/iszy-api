import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { IszyToolsService } from './iszy_tools.service';
import { AuthGuard } from '@nestjs/passport';
import { ResultDto } from '../../core/result.dto';

@ApiTags('ISZY Tools')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('iszy_tools')
export class IszyToolsController {
  constructor(private readonly iszyToolsService: IszyToolsService) {}

  @ApiBody({
    type: Object,
  })
  @Post('settings')
  async uploadSettings(
    @Request() req,
    @Body() settingDto: any,
  ): Promise<ResultDto> {
    const result = await this.iszyToolsService.uploadSettings(
      req.user.sub,
      settingDto,
    );
    return {
      code: '00000',
      data: result,
      message: result ? '更新成功' : '更新失败',
    };
  }

  @Get('settings')
  async downloadSettings(@Request() req) {
    const result = await this.iszyToolsService.downloadSettings(req.user.sub);
    return {
      code: '00000',
      data: result,
      message: result ? '获取成功' : '数据不存在',
    };
  }
}

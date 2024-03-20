import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JsoneditorService } from './jsoneditor.service'
import type { JsoneditorItemDto } from './dto/jsoneditor_item.dto'
import type { ResultDto } from '~core/dto/result.dto'
import type { JsoneditorModel } from '~entities/jsonEditor/jsoneditor.model'
import { AuthGuard } from '~core/guard/custom-auth.guard'
import type { AuthRequest } from '~types/AuthRequest'

@ApiTags('ISZY Tools')
@UseGuards(AuthGuard)
@Controller('tools/jsoneditor')
export class JsoneditorController {
  constructor(private readonly jsoneditorService: JsoneditorService) {}

  @Get()
  async getList(
    @Req() req: AuthRequest,
  ): Promise<ResultDto<JsoneditorModel[]>> {
    return {
      success: true,
      message: '获取成功',
      data: await this.jsoneditorService.getList(req.user.userId),
    }
  }

  @Post(':key')
  async updateItem(
    @Req() req: AuthRequest,
    @Param('key') key: string,
    @Body() jsoneditorItemDto: JsoneditorItemDto,
  ): Promise<ResultDto<null>> {
    if (jsoneditorItemDto != null) {
      const status = await this.jsoneditorService.updateItem(
        req.user.userId,
        key,
        jsoneditorItemDto.name,
        jsoneditorItemDto.text,
        jsoneditorItemDto.json,
      )
      return {
        message: status ? '成功' : '失败',
        success: status,
      }
    }
    return {
      message: '失败',
      success: false,
    }
  }

  @Delete(':key')
  async deleteItem(
    @Req() req: AuthRequest,
    @Param('key') key: string,
  ): Promise<ResultDto<null>> {
    const status = await this.jsoneditorService.deleteItem(
      req.user.userId,
      key,
    )
    return {
      message: status ? '成功' : '失败',
      success: status,
    }
  }
}

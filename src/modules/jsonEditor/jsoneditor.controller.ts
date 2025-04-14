import type { ResultDto } from '@zvonimirsun/iszy-common'
import type { JsoneditorModel } from '~entities/jsonEditor/jsoneditor.model'
import type { AuthRequest } from '~types/AuthRequest'
import type { JsoneditorItemDto } from './dto/jsoneditor_item.dto'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { JsoneditorService } from './jsoneditor.service'

@ApiBearerAuth()
@ApiTags('ISZY Tools')
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

import { JsoneditorService } from './jsoneditor.service';
import { Controller, Get, Param, Post, Request } from '@nestjs/common';
import { ResultDto } from '../../../../core/result.dto';
import { JsoneditorModel } from './entities/jsoneditor.model';
import { JsoneditorItemDto } from './dto/jsoneditor_item.dto';

@Controller('iszy_tools/jsoneditor')
export class JsoneditorController {
  constructor(private readonly jsoneditorService: JsoneditorService) {}

  @Get()
  async getList(): Promise<ResultDto<JsoneditorModel[]>> {
    return {
      success: true,
      message: '获取成功',
      data: await this.jsoneditorService.getList(),
    };
  }

  @Post(':key')
  async updateItem(
    @Request() req,
    @Param('key') key: string,
    jsoneditorItemDto: JsoneditorItemDto,
  ): Promise<ResultDto<null>> {
    if (jsoneditorItemDto != null) {
      const status = await this.jsoneditorService.updateItem(
        req.user.userId,
        key,
        jsoneditorItemDto.name,
        jsoneditorItemDto.text,
        jsoneditorItemDto.json,
      );
      return {
        message: status ? '成功' : '失败',
        success: status,
      };
    }
    return {
      message: '失败',
      success: false,
    };
  }
}

import { ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { IdiomService } from './Idiom.service';
import { ResultDto } from '../../../../core/result.dto';

@ApiTags('Idiom')
@Controller('idiom')
export class IdiomController {
  constructor(private readonly idiomService: IdiomService) {}

  @Get('handle')
  async getIdiomHandle(): Promise<ResultDto> {
    const result = await this.idiomService.getIdiomHandle();
    if (result) {
      return {
        code: '00000',
        message: '获取成功',
        data: result,
      };
    } else {
      return {
        code: 'C0100',
        message: '获取失败',
      };
    }
  }
}

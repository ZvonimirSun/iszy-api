import { ApiTags } from '@nestjs/swagger'
import { Controller, Get } from '@nestjs/common'
import { IdiomService } from './Idiom.service'
import type { ResultDto } from '~core/dto/result.dto'

@ApiTags('Idiom')
@Controller('idiom')
export class IdiomController {
  constructor(private readonly idiomService: IdiomService) {}

  @Get('handle')
  async getIdiomHandle(): Promise<ResultDto<any>> {
    const result = await this.idiomService.getIdiomHandle()
    if (result) {
      return {
        success: true,
        message: '获取成功',
        data: result,
      }
    }
    else {
      return {
        success: false,
        message: '获取失败',
      }
    }
  }
}

import type { ResultDto } from '@zvonimirsun/iszy-common'
import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '~core/decorator'
import { IdiomService } from './Idiom.service'

@Public()
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

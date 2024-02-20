import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { GisService } from './gis.service'
import type { TransformPointDto } from './dto/transform_point.dto'
import type { TransformGeometryDto } from './dto/transform_geometry.dto'
import type { ResultDto } from '~core/dto/result.dto'

@ApiTags('Gis')
@Controller('gis')
export class GisController {
  constructor(private readonly gisService: GisService) {}

  @Post('transform-point')
  async transformPoint(
    @Body() transformPointDto: TransformPointDto,
  ): Promise<ResultDto<any>> {
    const res = await this.gisService.transformPoint(transformPointDto)
    if (res) {
      return {
        success: true,
        data: res,
        message: '转换成功',
      }
    }
    else {
      return {
        success: false,
        data: res,
        message: '转换失败',
      }
    }
  }

  @Post('transform-geometry')
  async transformGeometry(
    @Body() transformGeometryDto: TransformGeometryDto,
  ): Promise<ResultDto<any>> {
    const res = await this.gisService.transformGeometry(transformGeometryDto)
    if (res) {
      return {
        success: true,
        data: res,
        message: '转换成功',
      }
    }
    else {
      return {
        success: false,
        data: res,
        message: '转换失败',
      }
    }
  }
}

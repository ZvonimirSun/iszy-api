import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GisService } from './gis.service';
import { TransformPointDto } from './dto/transform_point.dto';
import { ResultDto } from '../../core/result.dto';
import { TransformGeometryDto } from './dto/transform_geometry.dto';

@ApiTags('Gis')
@Controller('gis')
export class GisController {
  constructor(private readonly gisService: GisService) {}

  @Post('transformPoint')
  async transformPoint(
    @Body() transformPointDto: TransformPointDto,
  ): Promise<ResultDto> {
    const res = await this.gisService.transformPoint(transformPointDto);
    if (res) {
      return {
        code: '00000',
        data: res,
        message: '转换成功',
      };
    } else {
      return {
        code: 'B0102',
        data: res,
        message: '转换失败',
      };
    }
  }

  @Post('transformGeometry')
  async transformGeometry(@Body() transformGeometryDto: TransformGeometryDto) {
    const res = await this.gisService.transformGeometry(transformGeometryDto);
    if (res) {
      return {
        code: '00000',
        data: res,
        message: '转换成功',
      };
    } else {
      return {
        code: 'B0102',
        data: res,
        message: '转换失败',
      };
    }
  }
}

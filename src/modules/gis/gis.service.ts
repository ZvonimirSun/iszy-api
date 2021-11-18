import { Injectable, Logger } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';
import { TransformPointDto } from './dto/transform_point.dto';
import { TransformGeometryDto } from './dto/transform_geometry.dto';

@Injectable()
export class GisService {
  constructor(private sequelize: Sequelize) {}

  private readonly logger = new Logger(GisService.name);

  async transformPoint(transformPointDto: TransformPointDto) {
    try {
      const res: any = await this.sequelize.query(
        `select ST_AsGeoJSON(ST_Transform(ST_GeomFromText('POINT(${transformPointDto.x} ${transformPointDto.y})', ${transformPointDto.s_srs}), ${transformPointDto.t_srs})) as res;`,
        {
          plain: true,
          type: QueryTypes.SELECT,
        },
      );
      if (res) {
        const tmp = JSON.parse(res.res);
        return {
          x: tmp.coordinates[0],
          y: tmp.coordinates[1],
        };
      } else {
        return null;
      }
    } catch (e) {
      this.logger.error(e.message);
      return null;
    }
  }

  async transformGeometry(transformGeometryDto: TransformGeometryDto) {
    try {
      const res: any = await this.sequelize.query(
        `select ST_AsGeoJSON(ST_Transform(ST_GeomFromGeoJSON('${JSON.stringify(
          transformGeometryDto.geometry,
        )}'), ${transformGeometryDto.t_srs})) as res;`,
        {
          plain: true,
          type: QueryTypes.SELECT,
        },
      );
      if (res) {
        return JSON.parse(res.res);
      } else {
        return null;
      }
    } catch (e) {
      this.logger.error(e.message);
      return null;
    }
  }
}

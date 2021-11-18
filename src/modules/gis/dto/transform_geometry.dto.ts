import { ApiProperty } from '@nestjs/swagger';

export class TransformGeometryDto {
  @ApiProperty({
    description: 'geometry',
    default: { type: 'Point', coordinates: [121, 32] },
  })
  readonly geometry!: any;

  @ApiProperty({
    description: '来源SRID',
    default: 4490,
  })
  readonly s_srs!: number;

  @ApiProperty({
    description: '目标SRID',
    default: 4528,
  })
  readonly t_srs!: number;
}

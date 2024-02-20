import { ApiProperty } from '@nestjs/swagger'

export class TransformPointDto {
  @ApiProperty({
    description: '经度',
    default: 121,
  })
  readonly x!: number

  @ApiProperty({
    description: '纬度',
    default: 32,
  })
  readonly y!: number

  @ApiProperty({
    description: '来源SRID',
    default: 4490,
  })
  readonly s_srs!: number

  @ApiProperty({
    description: '目标SRID',
    default: 4528,
  })
  readonly t_srs!: number
}

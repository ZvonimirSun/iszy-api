import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportHolidayDto {
  @ApiProperty({
    description: '节假日开始日期',
    default: 20211001,
  })
  readonly startDate!: number;

  @ApiProperty({
    description: '节假日结束日期',
    default: 20211007,
  })
  readonly endDate!: number;

  @ApiProperty({
    description: '节假日名称',
  })
  readonly desc?: string;

  @ApiPropertyOptional({
    type: [Number],
    description: '调休日期列表',
  })
  readonly workdays?: number[];
}

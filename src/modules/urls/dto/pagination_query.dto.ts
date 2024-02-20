import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt } from 'class-validator'

export class PaginationQueryDto {
  @ApiPropertyOptional({
    type: Number,
    default: 0,
  })
  @IsInt()
  readonly pageIndex?: number = 1

  @ApiPropertyOptional({
    type: Number,
    default: 10,
  })
  @IsInt()
  readonly pageSize?: number = 10
}

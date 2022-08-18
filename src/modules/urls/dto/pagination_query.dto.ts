import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    type: Number,
    default: 0,
  })
  readonly pageIndex?: number = 1;

  @ApiPropertyOptional({
    type: Number,
    default: 10,
  })
  readonly pageSize?: number = 10;
}

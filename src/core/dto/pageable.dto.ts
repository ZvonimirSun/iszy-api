import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional } from 'class-validator'

export class PageableDto {
  @ApiPropertyOptional()
  @IsOptional()
  pageSize?: number

  @ApiPropertyOptional()
  @IsOptional()
  pageIndex?: number
}

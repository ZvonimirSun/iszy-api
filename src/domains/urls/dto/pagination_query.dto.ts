import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'

export const URL_SEARCH_FIELDS = ['all', 'keyword', 'url', 'title', 'ip'] as const
export const URL_ORDER_FIELDS = ['keyword', 'url', 'title', 'createdAt', 'updatedAt', 'ip', 'clicks'] as const
export const URL_ORDER_DIRECTIONS = ['asc', 'desc'] as const
export const URL_CLICKS_OPERATORS = ['more', 'less', 'equal'] as const
export const URL_CREATED_OPERATORS = ['before', 'after'] as const

export type UrlSearchField = typeof URL_SEARCH_FIELDS[number]
export type UrlOrderField = typeof URL_ORDER_FIELDS[number]
export type UrlOrderDirection = typeof URL_ORDER_DIRECTIONS[number]
export type UrlClicksOperator = typeof URL_CLICKS_OPERATORS[number]
export type UrlCreatedOperator = typeof URL_CREATED_OPERATORS[number]

export class PaginationQueryDto {
  @ApiPropertyOptional({
    type: Number,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly pageIndex?: number = 0

  @ApiPropertyOptional({
    type: Number,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  readonly pageSize?: number = 10

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly search?: string

  @ApiPropertyOptional({
    enum: URL_SEARCH_FIELDS,
    default: 'all',
  })
  @IsOptional()
  @IsIn(URL_SEARCH_FIELDS)
  readonly searchField?: UrlSearchField = 'all'

  @ApiPropertyOptional({
    enum: URL_ORDER_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(URL_ORDER_FIELDS)
  readonly orderBy?: UrlOrderField = 'createdAt'

  @ApiPropertyOptional({
    enum: URL_ORDER_DIRECTIONS,
    default: 'desc',
  })
  @IsOptional()
  @IsIn(URL_ORDER_DIRECTIONS)
  readonly orderDirection?: UrlOrderDirection = 'desc'

  @ApiPropertyOptional({
    enum: URL_CLICKS_OPERATORS,
  })
  @IsOptional()
  @IsIn(URL_CLICKS_OPERATORS)
  readonly clicksOperator?: UrlClicksOperator

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly clicks?: number

  @ApiPropertyOptional({
    enum: URL_CREATED_OPERATORS,
  })
  @IsOptional()
  @IsIn(URL_CREATED_OPERATORS)
  readonly createdOperator?: UrlCreatedOperator

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  readonly createdAt?: string
}

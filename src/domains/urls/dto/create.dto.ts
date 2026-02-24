import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateDto {
  @ApiProperty()
  readonly url: string

  @ApiPropertyOptional()
  readonly keyword?: string
}

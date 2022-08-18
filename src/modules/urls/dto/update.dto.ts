import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDto {
  @ApiPropertyOptional()
  readonly url?: string;

  @ApiPropertyOptional()
  readonly title?: string;
}

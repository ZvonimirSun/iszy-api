import { ApiPropertyOptional } from '@nestjs/swagger';

export class JsoneditorItemDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  text?: string;

  @ApiPropertyOptional()
  json?: string;
}

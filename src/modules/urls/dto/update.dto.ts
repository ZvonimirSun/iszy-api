import { ApiProperty } from '@nestjs/swagger';

export class UpdateDto {
  @ApiProperty()
  readonly url: string;
}

import { ApiProperty } from '@nestjs/swagger';

export class AddAccountDto {
  @ApiProperty()
  readonly pk!: string;
}

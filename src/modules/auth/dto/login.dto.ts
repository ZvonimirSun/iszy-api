import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty()
  readonly userName!: string;

  @ApiProperty()
  readonly password!: string;
}

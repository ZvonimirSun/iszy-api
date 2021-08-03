import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty()
  readonly userName!: string;

  @ApiProperty()
  readonly nickName!: string;

  @ApiProperty()
  readonly password!: string;

  @ApiProperty()
  readonly mobile?: string;
}

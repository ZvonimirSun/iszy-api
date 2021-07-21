import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  accountName: string;

  @ApiProperty()
  realName: string;

  @ApiProperty()
  password: string;

  @ApiProperty()
  rePassword: string;

  @ApiProperty()
  mobile: string;
}

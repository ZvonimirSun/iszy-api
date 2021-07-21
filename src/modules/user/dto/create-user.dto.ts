import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  userName: string;

  @ApiProperty()
  nickName: string;

  @ApiProperty()
  password: string;

  @ApiProperty()
  rePassword: string;

  @ApiProperty()
  mobile: string;
}

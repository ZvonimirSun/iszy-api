import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  userName: string;

  @ApiProperty()
  nickName: string;

  @ApiProperty()
  passwd: string;

  @ApiProperty()
  passwdSalt: string;

  @ApiProperty()
  mobile: string;

  @ApiProperty()
  userStatus: number;

  @ApiProperty()
  createBy: number;

  @ApiProperty()
  updateBy: number;
}

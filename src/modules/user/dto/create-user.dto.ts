import { userAttributes } from '../interfaces/user.interfaces';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto implements userAttributes {
  @ApiProperty()
  createBy: number;

  @ApiProperty()
  mobile: string;

  @ApiProperty()
  nickName: string;

  @ApiProperty()
  passwd: string;

  @ApiProperty()
  passwdSalt: string;

  @ApiProperty()
  role: number;

  @ApiProperty()
  updateBy: number;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  userStatus: number;
}

import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: '用户名',
  })
  readonly userName!: string;

  @ApiProperty({
    description: '密码',
  })
  readonly password!: string;
}

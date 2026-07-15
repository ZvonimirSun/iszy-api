import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({
    description: '用户名或邮箱',
  })
  readonly username!: string

  @ApiProperty({
    description: '密码',
  })
  readonly password!: string
}

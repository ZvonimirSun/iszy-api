import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty({
    description: '用户名',
  })
  userName!: string

  @ApiProperty({
    description: '昵称',
  })
  nickName!: string

  @ApiProperty({
    description: '密码',
  })
  password!: string

  @ApiPropertyOptional({
    description: '手机号',
  })
  mobile?: string

  @ApiPropertyOptional({
    description: '邮箱',
  })
  email?: string
}

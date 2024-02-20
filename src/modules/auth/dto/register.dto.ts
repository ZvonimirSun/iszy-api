import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty({
    description: '用户名',
  })
  readonly userName!: string

  @ApiProperty({
    description: '昵称',
  })
  readonly nickName!: string

  @ApiProperty({
    description: '密码',
  })
  readonly password!: string

  @ApiPropertyOptional({
    description: '手机号',
  })
  readonly mobile?: string

  @ApiPropertyOptional({
    description: '邮箱',
  })
  readonly email?: string
}

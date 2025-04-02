import type { RegisterUser } from '@zvonimirsun/iszy-common'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RegisterDto implements RegisterUser {
  @ApiProperty({
    description: '用户名',
  })
  userName: string

  @ApiProperty({
    description: '昵称',
  })
  nickName: string

  @ApiProperty({
    description: '密码',
  })
  passwd: string

  @ApiPropertyOptional({
    description: '手机号',
  })
  mobile?: string

  @ApiPropertyOptional({
    description: '邮箱',
  })
  email?: string
}

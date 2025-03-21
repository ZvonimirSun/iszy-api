import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { RawUser } from '~entities/user'

export class UpdateProfileDto implements Partial<RawUser> {
  @ApiProperty({
    description: '用户名',
  })
  userName: string

  @ApiProperty({
    description: '昵称',
  })
  nickName?: string

  @ApiPropertyOptional({
    description: '邮箱',
  })
  email?: string

  @ApiPropertyOptional({
    description: '手机号',
  })
  mobile?: string

  @ApiPropertyOptional({
    description: '新密码',
  })
  passwd?: string

  @ApiPropertyOptional({
    description: '旧密码',
  })
  oldPasswd?: string
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class SsoResolveDto {
  @ApiProperty({
    description: 'SSO 绑定票据',
  })
  bindToken: string

  @ApiProperty({
    description: '处理方式',
    enum: ['bind', 'create'],
  })
  action: 'bind' | 'create'

  @ApiPropertyOptional({
    description: '绑定已有账户时用于校验的密码',
  })
  password?: string
}

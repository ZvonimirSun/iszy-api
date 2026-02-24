import { ApiProperty } from '@nestjs/swagger'

export class DDNSUpdateDto {
  @ApiProperty({
    description: '域名',
    example: 'www.example.com',
    required: true,
  })
  readonly hostname: string

  @ApiProperty({
    description: 'IP地址',
    example: '192.168.1.1',
    required: true,
  })
  readonly ip: string

  @ApiProperty({
    description: '用户名',
    example: 'example.com',
    required: true,
  })
  readonly username: string

  @ApiProperty({
    description: '密码',
    example: '1234567890',
    required: true,
  })
  readonly password: string
}

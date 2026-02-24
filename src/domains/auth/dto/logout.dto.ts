import { ApiPropertyOptional } from '@nestjs/swagger'

export class LogoutDto {
  @ApiPropertyOptional({
    description: '登出指定设备',
  })
  deviceId?: string

  @ApiPropertyOptional({
    description: '登出所有',
  })
  readonly all?: boolean

  @ApiPropertyOptional({
    description: '登出其他',
  })
  readonly other?: boolean
}

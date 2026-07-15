import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'

export class SsoCompletionDto {
  @ApiProperty({
    description: 'SSO 登录待完成凭证',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  pendingToken: string
}

export class SsoBindCompletionDto extends SsoCompletionDto {
  @ApiProperty({
    description: '已有账户的用户名或邮箱',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  username: string

  @ApiProperty({
    description: '已有账户的密码',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  password: string

  @ApiPropertyOptional({
    description: '是否使用 SSO 昵称覆盖当前账户昵称',
  })
  @IsOptional()
  @IsBoolean()
  useSsoNickname?: boolean
}

export class SsoCreateCompletionDto extends SsoCompletionDto {
  @ApiProperty({
    description: '用户名',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  userName: string

  @ApiProperty({
    description: '昵称',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nickName: string

  @ApiPropertyOptional({
    description: '邮箱',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string

  @ApiProperty({
    description: '密码',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  passwd: string
}

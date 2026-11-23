import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger'
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateIf } from 'class-validator'
import { PageableDto } from '~shared'

export class CreateRoleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  alias: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  desc?: string
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

export class CreateGroupDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  alias: string

  @ApiPropertyOptional({ type: Number, nullable: true })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  @IsOptional()
  parentId?: number | null
}

export class UpdateGroupDto extends PartialType(OmitType(CreateGroupDto, ['parentId'] as const)) {
  @ApiPropertyOptional({ type: Number, nullable: true })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  @IsOptional()
  parentId?: number | null
}

export class CreatePrivilegeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string
}

export class UpdatePrivilegeDto extends PartialType(CreatePrivilegeDto) {}

// Relationship update endpoints replace the complete relation set with these ids.
export class SetRoleIdsDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  roleIds: number[]
}

export class SetUserIdsDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  userIds: number[]
}

export class SetGroupIdsDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  groupIds: number[]
}

export class SetPrivilegeIdsDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  privilegeIds: number[]
}

export class UserPageQueryDto extends PageableDto {
  @ApiPropertyOptional({ description: '关键词，匹配 ID、用户名、昵称、邮箱或手机号' })
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ description: '用户状态' })
  @IsOptional()
  @IsInt()
  status?: number
}

export class MemberPageQueryDto extends PageableDto {
  @ApiPropertyOptional({ description: '关键词，匹配用户名、昵称、邮箱或手机号' })
  @IsOptional()
  @IsString()
  keyword?: string
}

export class UserSearchQueryDto {
  @ApiPropertyOptional({ description: '用户名或关键词' })
  @IsOptional()
  @IsString()
  userName?: string

  @ApiPropertyOptional({ description: '关键词（与 userName 等价，优先取 keyword）' })
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ description: '返回条数上限（1-50，默认 10）' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number

  @ApiPropertyOptional({ description: '是否包含非启用状态用户' })
  @IsOptional()
  @IsBoolean()
  includeDisabled?: boolean
}

export interface PageResult<T> {
  items: T[]
  total: number
  pageIndex: number
  pageSize: number
}

export interface RbacStats {
  users: {
    total: number
    enabled: number
    deactivated: number
    disabled: number
  }
  roles: number
  groups: number
  privileges: number
}

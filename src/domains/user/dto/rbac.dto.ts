import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator'

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

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  parentId?: number
}

export class UpdateGroupDto extends PartialType(CreateGroupDto) {}

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

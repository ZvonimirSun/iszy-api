import type { RawGroup, ResultDto } from '@zvonimirsun/iszy-common'
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { RoleEnum } from '@zvonimirsun/iszy-common'
import { Roles } from '~shared'
import { CreateGroupDto, SetRoleIdsDto, UpdateGroupDto } from './dto/rbac.dto'
import { UserService } from './user.service'

@ApiBearerAuth()
@ApiTags('RBAC')
@Roles(RoleEnum.SUPERADMIN)
// RBAC resources use top-level routes to match the existing user API style.
@Controller('groups')
export class GroupController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getGroups(): Promise<ResultDto<RawGroup[]>> {
    return {
      success: true,
      data: await this.userService.findAllGroups(),
      message: '获取成功',
    }
  }

  @Get(':id')
  async getGroup(@Param('id') id: number): Promise<ResultDto<RawGroup>> {
    return {
      success: true,
      data: await this.userService.findGroupById(id),
      message: '获取成功',
    }
  }

  @Post()
  async createGroup(@Body() groupDto: CreateGroupDto): Promise<ResultDto<RawGroup>> {
    return {
      success: true,
      data: await this.userService.createGroup(groupDto),
      message: '创建成功',
    }
  }

  @Put(':id')
  async updateGroup(@Param('id') id: number, @Body() groupDto: UpdateGroupDto): Promise<ResultDto<RawGroup>> {
    return {
      success: true,
      data: await this.userService.updateGroup(id, groupDto),
      message: '更新成功',
    }
  }

  @Put(':id/roles')
  async setGroupRoles(
    @Param('id') id: number,
    @Body() setRoleIdsDto: SetRoleIdsDto,
  ): Promise<ResultDto<RawGroup>> {
    return {
      success: true,
      data: await this.userService.setGroupRoles(id, setRoleIdsDto.roleIds),
      message: '更新成功',
    }
  }

  @Delete(':id')
  async removeGroup(@Param('id') id: number): Promise<ResultDto<boolean>> {
    return {
      success: true,
      data: await this.userService.removeGroup(id),
      message: '删除成功',
    }
  }
}

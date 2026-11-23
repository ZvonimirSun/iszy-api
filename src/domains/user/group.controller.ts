import type { PublicUser, RawGroup, ResultDto } from '@zvonimirsun/iszy-common'
import type { PageResult } from './dto/rbac.dto'
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { RoleEnum } from '@zvonimirsun/iszy-common'
import { Roles } from '~shared'
import { CreateGroupDto, MemberPageQueryDto, SetRoleIdsDto, SetUserIdsDto, UpdateGroupDto } from './dto/rbac.dto'
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

  @Get(':id/users')
  async getGroupUsers(
    @Param('id') id: number,
    @Query() query: MemberPageQueryDto,
  ): Promise<ResultDto<PageResult<PublicUser>>> {
    return {
      success: true,
      data: await this.userService.findGroupUsersPage(id, query),
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

  @Put(':id/users')
  async setGroupUsers(
    @Param('id') id: number,
    @Body() setUserIdsDto: SetUserIdsDto,
  ): Promise<ResultDto<RawGroup>> {
    return {
      success: true,
      data: await this.userService.setGroupUsers(id, setUserIdsDto.userIds),
      message: '更新成功',
    }
  }

  @Post(':id/users')
  async addGroupUsers(
    @Param('id') id: number,
    @Body() setUserIdsDto: SetUserIdsDto,
  ): Promise<ResultDto<RawGroup>> {
    return {
      success: true,
      data: await this.userService.addGroupUsers(id, setUserIdsDto.userIds),
      message: '添加成功',
    }
  }

  @Delete(':id/users')
  async removeGroupUsers(
    @Param('id') id: number,
    @Body() setUserIdsDto: SetUserIdsDto,
  ): Promise<ResultDto<RawGroup>> {
    return {
      success: true,
      data: await this.userService.removeGroupUsers(id, setUserIdsDto.userIds),
      message: '移除成功',
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

import type { RawRole, ResultDto } from '@zvonimirsun/iszy-common'
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { RoleEnum } from '@zvonimirsun/iszy-common'
import { Roles } from '~shared'
import { CreateRoleDto, SetPrivilegeIdsDto, UpdateRoleDto } from './dto/rbac.dto'
import { UserService } from './user.service'

@ApiBearerAuth()
@ApiTags('RBAC')
@Roles(RoleEnum.SUPERADMIN)
// RBAC resources use top-level routes to match the existing user API style.
@Controller('roles')
export class RoleController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getRoles(): Promise<ResultDto<RawRole[]>> {
    return {
      success: true,
      data: await this.userService.findAllRoles(),
      message: '获取成功',
    }
  }

  @Get(':id')
  async getRole(@Param('id') id: number): Promise<ResultDto<RawRole>> {
    return {
      success: true,
      data: await this.userService.findRoleById(id),
      message: '获取成功',
    }
  }

  @Post()
  async createRole(@Body() roleDto: CreateRoleDto): Promise<ResultDto<RawRole>> {
    return {
      success: true,
      data: await this.userService.createRole(roleDto),
      message: '创建成功',
    }
  }

  @Put(':id')
  async updateRole(@Param('id') id: number, @Body() roleDto: UpdateRoleDto): Promise<ResultDto<RawRole>> {
    return {
      success: true,
      data: await this.userService.updateRole(id, roleDto),
      message: '更新成功',
    }
  }

  @Put(':id/privileges')
  async setRolePrivileges(
    @Param('id') id: number,
    @Body() setPrivilegeIdsDto: SetPrivilegeIdsDto,
  ): Promise<ResultDto<RawRole>> {
    return {
      success: true,
      data: await this.userService.setRolePrivileges(id, setPrivilegeIdsDto.privilegeIds),
      message: '更新成功',
    }
  }

  @Delete(':id')
  async removeRole(@Param('id') id: number): Promise<ResultDto<boolean>> {
    return {
      success: true,
      data: await this.userService.removeRole(id),
      message: '删除成功',
    }
  }
}

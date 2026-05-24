import type { RawPrivilege, ResultDto } from '@zvonimirsun/iszy-common'
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { RoleEnum } from '@zvonimirsun/iszy-common'
import { Roles } from '~shared'
import { CreatePrivilegeDto, UpdatePrivilegeDto } from './dto/rbac.dto'
import { UserService } from './user.service'

@ApiBearerAuth()
@ApiTags('RBAC')
@Roles(RoleEnum.SUPERADMIN)
// RBAC resources use top-level routes to match the existing user API style.
@Controller('privileges')
export class PrivilegeController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getPrivileges(): Promise<ResultDto<RawPrivilege[]>> {
    return {
      success: true,
      data: await this.userService.findAllPrivileges(),
      message: '获取成功',
    }
  }

  @Get(':id')
  async getPrivilege(@Param('id') id: number): Promise<ResultDto<RawPrivilege>> {
    return {
      success: true,
      data: await this.userService.findPrivilegeById(id),
      message: '获取成功',
    }
  }

  @Post()
  async createPrivilege(@Body() privilegeDto: CreatePrivilegeDto): Promise<ResultDto<RawPrivilege>> {
    return {
      success: true,
      data: await this.userService.createPrivilege(privilegeDto),
      message: '创建成功',
    }
  }

  @Put(':id')
  async updatePrivilege(
    @Param('id') id: number,
    @Body() privilegeDto: UpdatePrivilegeDto,
  ): Promise<ResultDto<RawPrivilege>> {
    return {
      success: true,
      data: await this.userService.updatePrivilege(id, privilegeDto),
      message: '更新成功',
    }
  }

  @Delete(':id')
  async removePrivilege(@Param('id') id: number): Promise<ResultDto<boolean>> {
    return {
      success: true,
      data: await this.userService.removePrivilege(id),
      message: '删除成功',
    }
  }
}

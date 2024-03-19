import { ApiTags } from '@nestjs/swagger'
import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { UserService } from '~modules/user/user.service'
import { Roles } from '~core/decorator/roles.decorator'
import { RoleEnum } from '~core/enum/role.enum'
import { RolesGuard } from '~core/guard/roles.guard'
import { CustomAuthGuard } from '~core/guard/custom-auth.guard'
import { ResultDto } from '~core/dto/result.dto'
import { User } from '~entities/user/user.model'

@ApiTags('User')
@Roles(RoleEnum.ADMIN, RoleEnum.SUPERADMIN)
@UseGuards(CustomAuthGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('list')
  async getUserByPage(
    @Query('pageIndex') pageIndex: number,
    @Query('pageSize') pageSize: number,
  ): Promise<ResultDto<User[]>> {
    const users = await this.userService.findAllByPage(pageIndex, pageSize)
    return {
      success: true,
      data: users,
      message: '获取成功',
    }
  }

  @Post('activate')
  async activateUser(@Query('id') id: number): Promise<ResultDto<boolean>> {
    await this.userService.activateUser(id)
    return {
      success: true,
      message: '激活成功',
    }
  }

  @Post('ban')
  async banUser(@Query('id') id: number): Promise<ResultDto<boolean>> {
    await this.userService.disableUser(id)
    return {
      success: true,
      message: '禁用成功',
    }
  }

  @Post('remove')
  async removeUser(@Query('id') id: number): Promise<ResultDto<boolean>> {
    await this.userService.removeUser(id)
    return {
      success: true,
      message: '删除成功',
    }
  }
}

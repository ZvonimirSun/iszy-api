import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Roles } from '~core/decorator/roles.decorator'
import { ResultDto } from '~core/dto/result.dto'
import { RoleEnum } from '~core/enum/role.enum'
import { AuthGuard } from '~core/guard/custom-auth.guard'
import { PublicUser, User } from '~entities/user/user.model'
import { UserService } from '~modules/user/user.service'

@ApiTags('User')
@Roles(RoleEnum.SUPERADMIN)
@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('list')
  async getUserByPage(
    @Query('pageIndex') pageIndex: number,
    @Query('pageSize') pageSize: number,
  ): Promise<ResultDto<PublicUser[]>> {
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

  @Roles()
  @Get('search')
  async searchUserName(@Query('userName') userName: string): Promise<ResultDto<Pick<User, 'userId' | 'userName' | 'nickName'>[]>> {
    return {
      success: true,
      message: '搜索成功',
      data: await this.userService.searchUserName(userName),
    }
  }

  @Get(':id')
  async getUserById(@Param('id') id: number): Promise<ResultDto<PublicUser>> {
    return {
      success: true,
      data: await this.userService.findOne(id, true),
      message: '获取成功',
    }
  }
}

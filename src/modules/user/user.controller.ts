import type { AuthRequest } from '~types/AuthRequest'
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import bcrypt from 'bcrypt'
import { Roles } from '~core/decorator/roles.decorator'
import { PageableDto } from '~core/dto/pageable.dto'
import { ResultDto } from '~core/dto/result.dto'
import { RoleEnum } from '~core/enum/role.enum'
import { AuthGuard } from '~core/guard/custom-auth.guard'
import { PublicUser, RawUser, User } from '~entities/user/user.model'
import { RegisterDto } from '~modules/auth/dto/register.dto'
import { UserService } from '~modules/user/user.service'
import { UserStatus } from '~modules/user/variables/user.status'

@ApiTags('User')
@Roles(RoleEnum.SUPERADMIN)
@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('list')
  async getUserByPage(
    @Query() pageable: PageableDto,
  ): Promise<ResultDto<PublicUser[]>> {
    const users = await this.userService.findAllByPage(pageable.pageIndex, pageable.pageSize)
    return {
      success: true,
      data: users,
      message: '获取成功',
    }
  }

  @Put('activate')
  async activateUser(@Req() req: AuthRequest, @Query('id') id: number): Promise<ResultDto<boolean>> {
    await this.userService.activateUser(id, req.user.userId)
    return {
      success: true,
      message: '激活成功',
    }
  }

  @Put('ban')
  async banUser(@Req() req: AuthRequest, @Query('id') id: number): Promise<ResultDto<boolean>> {
    await this.userService.disableUser(id, req.user.userId)
    return {
      success: true,
      message: '禁用成功',
    }
  }

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

  @Delete(':id')
  async removeUser(@Param('id') id: number): Promise<ResultDto<boolean>> {
    await this.userService.removeUser(id)
    return {
      success: true,
      message: '删除成功',
    }
  }

  @Put(':id')
  async updateUser(@Req() req: AuthRequest, @Param('id') id: number, @Body() userProfile: Partial<RawUser>): Promise<ResultDto<PublicUser>> {
    const newProfile: Partial<RawUser> = {}
    if (userProfile.passwd) {
      newProfile.passwdSalt = ''
      newProfile.passwd = await bcrypt.hash(userProfile.passwd, 10)
    }
    newProfile.userId = id
    if (userProfile.nickName)
      newProfile.nickName = userProfile.nickName
    if (userProfile.email)
      newProfile.email = userProfile.email
    if (userProfile.mobile)
      newProfile.mobile = userProfile.mobile
    newProfile.updateBy = req.user.userId

    const updatedUser = await this.userService.updateUser(newProfile)
    const { passwd, passwdSalt, ...result } = updatedUser

    return {
      success: true,
      data: result,
      message: '更新成功',
    }
  }

  @Post()
  async createUser(@Body() registerDto: RegisterDto) {
    try {
      const user: Partial<RawUser> = {}
      user.userName = registerDto.userName.toLowerCase()
      user.nickName = registerDto.nickName
      user.passwd = await bcrypt.hash(registerDto.password, 10)
      user.mobile = registerDto.mobile || undefined
      user.email = registerDto.email || undefined
      user.status = UserStatus.ENABLED
      const newUser = await this.userService.create(user)
      return {
        success: true,
        data: newUser,
        message: '创建成功',
      }
    }
    catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        const error = e.errors[0]
        if (error) {
          switch (error.path) {
            case 'userName': {
              throw new Error('用户已存在')
            }
            case 'mobile': {
              throw new Error('手机号已存在')
            }
            case 'email': {
              throw new Error('邮箱已被绑定')
            }
            default: {
              throw new Error(error.message)
            }
          }
        }
        else {
          throw new Error(e.name)
        }
      }
      throw new Error(e.name ? e.name + e.message : e.message)
    }
  }
}

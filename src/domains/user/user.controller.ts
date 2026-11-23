import type { PublicUser, RawUser } from '@zvonimirsun/iszy-common'
import type { AuthRequest, MinimalUser } from '~shared'
import type { PageResult, RbacStats } from './dto/rbac.dto'
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { REGEX_EMAIL, REGEX_MOBILE_PHONE, ResultDto, RoleEnum, UserStatus } from '@zvonimirsun/iszy-common'
import bcrypt from 'bcrypt'
import { CreateUserDto } from '~domains/user/dto/createUser.dto'
import { PageableDto, Roles, toPublicUser } from '~shared'
import { SetGroupIdsDto, SetRoleIdsDto, UserPageQueryDto, UserSearchQueryDto } from './dto/rbac.dto'
import { UserService } from './user.service'

type AdminUpdateUserBody = Partial<Omit<RawUser, 'email' | 'mobile'>> & {
  email?: string | null
  mobile?: string | null
}

@ApiBearerAuth()
@ApiTags('User')
@Roles(RoleEnum.SUPERADMIN)
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

  @Get('page')
  async getUsersPage(
    @Query() query: UserPageQueryDto,
  ): Promise<ResultDto<PageResult<PublicUser>>> {
    return {
      success: true,
      data: await this.userService.findUsersPage(query),
      message: '获取成功',
    }
  }

  @Get('stats')
  async getRbacStats(): Promise<ResultDto<RbacStats>> {
    return {
      success: true,
      data: await this.userService.getRbacStats(),
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
  async searchUserName(@Query() query: UserSearchQueryDto): Promise<ResultDto<MinimalUser[]>> {
    const keyword = query.keyword ?? query.userName ?? ''
    return {
      success: true,
      message: '搜索成功',
      data: await this.userService.searchUserName(keyword, query.limit, query.includeDisabled),
    }
  }

  @Get(':id')
  async getUserById(@Param('id') id: number): Promise<ResultDto<PublicUser>> {
    return {
      success: true,
      data: toPublicUser(await this.userService.findOne(id)),
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

  // Role and group endpoints replace the user's complete RBAC relation set.
  @Put(':id/roles')
  async setUserRoles(
    @Req() req: AuthRequest,
    @Param('id') id: number,
    @Body() setRoleIdsDto: SetRoleIdsDto,
  ): Promise<ResultDto<PublicUser>> {
    const updatedUser = await this.userService.setUserRoles(id, setRoleIdsDto.roleIds, req.user.userId)
    return {
      success: true,
      data: toPublicUser(updatedUser),
      message: '更新成功',
    }
  }

  @Put(':id/groups')
  async setUserGroups(
    @Req() req: AuthRequest,
    @Param('id') id: number,
    @Body() setGroupIdsDto: SetGroupIdsDto,
  ): Promise<ResultDto<PublicUser>> {
    const updatedUser = await this.userService.setUserGroups(id, setGroupIdsDto.groupIds, req.user.userId)
    return {
      success: true,
      data: toPublicUser(updatedUser),
      message: '更新成功',
    }
  }

  @Put(':id')
  async updateUser(
    @Req() req: AuthRequest,
    @Param('id') id: number,
    @Body() userProfile: AdminUpdateUserBody,
  ): Promise<ResultDto<PublicUser>> {
    const newProfile: Record<string, unknown> = {
      userId: id,
    }
    if (userProfile.passwd) {
      newProfile.passwdSalt = ''
      newProfile.passwd = await bcrypt.hash(userProfile.passwd, 10)
    }
    if (userProfile.nickName !== undefined) {
      const trimmedNick = userProfile.nickName.trim()
      if (!trimmedNick) {
        throw new Error('昵称值非法')
      }
      newProfile.nickName = trimmedNick
    }
    if ('email' in userProfile && userProfile.email !== undefined) {
      const trimmedEmail = typeof userProfile.email === 'string' ? userProfile.email.trim().toLowerCase() : ''
      if (!trimmedEmail) {
        newProfile.email = null
      }
      else {
        if (!REGEX_EMAIL.test(trimmedEmail)) {
          throw new Error('邮箱值非法')
        }
        newProfile.email = trimmedEmail
      }
    }
    if ('mobile' in userProfile && userProfile.mobile !== undefined) {
      const trimmedMobile = typeof userProfile.mobile === 'string' ? userProfile.mobile.trim() : ''
      if (!trimmedMobile) {
        newProfile.mobile = null
      }
      else {
        if (!REGEX_MOBILE_PHONE.test(trimmedMobile)) {
          throw new Error('手机号值非法')
        }
        newProfile.mobile = trimmedMobile
      }
    }

    try {
      const updatedUser = await this.userService.updateUser(newProfile as Partial<RawUser>, req.user.userId)

      return {
        success: true,
        data: toPublicUser(updatedUser),
        message: '更新成功',
      }
    }
    catch (e) {
      this.rethrowUniqueConstraintError(e)
    }
  }

  @Post()
  async createUser(@Req() req: AuthRequest, @Body() registerDto: CreateUserDto): Promise<ResultDto<PublicUser>> {
    try {
      const user: Partial<RawUser> = {}
      user.userName = registerDto.userName.toLowerCase()
      user.nickName = registerDto.nickName
      user.passwd = await bcrypt.hash(registerDto.passwd, 10)
      user.mobile = registerDto.mobile || undefined
      user.email = registerDto.email || undefined
      user.status = UserStatus.ENABLED
      const newUser = await this.userService.create(user, req.user.userId)
      return {
        success: true,
        data: toPublicUser(newUser),
        message: '创建成功',
      }
    }
    catch (e) {
      this.rethrowUniqueConstraintError(e)
    }
  }

  private rethrowUniqueConstraintError(e: any): never {
    if (e?.name === 'SequelizeUniqueConstraintError') {
      const error = e.errors?.[0]
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
      throw new Error(e.name)
    }
    throw new Error(e?.name && e?.name !== 'Error' ? e.name + e.message : e?.message || '操作失败')
  }
}

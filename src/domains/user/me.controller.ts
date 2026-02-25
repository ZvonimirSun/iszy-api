import type { AuthRequest } from '~types/AuthRequest'
import { Body, Controller, Delete, Get, Param, Post, Put, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { PublicUser, RawUser, ResultDto } from '@zvonimirsun/iszy-common'
import bcrypt from 'bcrypt'
import { toPublicUser } from '~utils/user'
import { UpdateUserDto } from './dto/updateUser.dto'
import { UserService } from './user.service'

@ApiBearerAuth()
@ApiTags('User')
@Controller('user/me')
export class MeController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getCurrentUser(@Req() req: AuthRequest): Promise<ResultDto<PublicUser>> {
    const user = await this.userService.findOne(req.user.userName)
    if (!user) {
      throw new Error('用户不存在')
    }
    return {
      success: true,
      data: toPublicUser(user),
      message: '获取成功',
    }
  }

  @Put()
  async updateCurrentUser(
    @Req() req: AuthRequest,
    @Body() userProfile: UpdateUserDto,
  ): Promise<ResultDto<PublicUser>> {
    const user = await this.userService.findOne(req.user.userName)
    if (!user) {
      throw new Error('用户不存在')
    }
    const newProfile: Partial<RawUser> = {}
    this.userService.normalizeUserInfo(userProfile)
    if (userProfile.passwd) {
      if (!user.passwd) {
        // 用户初始设置密码
        newProfile.passwd = await bcrypt.hash(userProfile.passwd, 10)
      }
      else {
        const checkResult = await this.userService.checkUser(user, userProfile.oldPasswd, false)
        if (!checkResult) {
          throw new Error('密码错误')
        }
        newProfile.passwdSalt = ''
        newProfile.passwd = await bcrypt.hash(userProfile.passwd, 10)
      }
    }
    newProfile.userId = user.userId
    if (userProfile.userName)
      newProfile.userName = userProfile.userName
    if (userProfile.nickName)
      newProfile.nickName = userProfile.nickName
    if (userProfile.email)
      newProfile.email = userProfile.email
    if (userProfile.mobile)
      newProfile.mobile = userProfile.mobile
    newProfile.updateBy = user.userId
    const updatedUser = await this.userService.updateUser(newProfile)
    return {
      success: true,
      data: toPublicUser(updatedUser),
      message: '更新成功',
    }
  }

  @Post('bind/:type/:id')
  async bind(
    @Req() req: AuthRequest,
    @Param('type') type: string,
    @Param('id') id: string,
  ): Promise<ResultDto<void>> {
    const types = ['github', 'linuxdo']
    if (!types.includes(type)) {
      throw new Error('不支持的绑定类型')
    }
    const userId = req.user.userId
    const user = await this.userService.findOne(userId)
    if (!user) {
      throw new Error('用户不存在')
    }
    await this.userService.updateUser({
      userId,
      [type]: id,
    })
    return {
      success: true,
      message: '绑定成功',
    }
  }

  @Delete('bind/:type')
  async unbind(
    @Req() req: AuthRequest,
    @Param('type') type: string,
  ): Promise<ResultDto<void>> {
    const types = ['github', 'linuxdo']
    if (!types.includes(type)) {
      throw new Error('不支持的绑定类型')
    }
    const userId = req.user.userId
    const user = await this.userService.findOne(userId)
    if (!user) {
      throw new Error('用户不存在')
    }
    await this.userService.updateUser({
      userId,
      [type]: null,
    })
    return {
      success: true,
      message: '解绑成功',
    }
  }
}

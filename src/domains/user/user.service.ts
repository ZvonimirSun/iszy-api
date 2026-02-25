import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import {
  PublicUser,
  RawUser,
  REGEX_EMAIL,
  REGEX_MOBILE_PHONE,
  RegisterUser,
  UpdateUser,
  UserStatus,
} from '@zvonimirsun/iszy-common'
import bcrypt from 'bcrypt'
import { FindOptions, Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { DeviceStore } from '~domains/auth/store/device-store'
import { MinimalUser } from '~types/user'
import { Group, Privilege, Role, User } from './entities'
import { UserStore } from './store/user-store'
import { encryptPassword } from './utils/cryptogram'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    private sequelize: Sequelize,
    private readonly userStore: UserStore,
    private readonly deviceStore: DeviceStore,
  ) {}

  private readonly logger = new Logger(UserService.name)

  async create(user: Partial<RawUser>, userId?: number): Promise<RawUser> {
    const userItem = await this.sequelize.transaction(async (t) => {
      const transactionHost = { transaction: t }
      if (userId != null) {
        return await this.userModel.create(
          { ...user, createBy: userId, updateBy: userId },
          transactionHost,
        )
      }
      else {
        const userEntity = await this.userModel.create(user, transactionHost)
        return await userEntity.update({
          createBy: userEntity.id,
          updateBy: userEntity.id,
        }, transactionHost)
      }
    })
    return userItem.get({
      plain: true,
    })
  }

  async findOne(userIdOrName: string | number): Promise<RawUser> {
    const cached = await this.userStore.getUser(userIdOrName)
    if (cached) {
      await this.userStore.setUser(cached)
      return cached
    }
    let where: Partial<RawUser>
    if (typeof userIdOrName === 'number') {
      where = {
        userId: userIdOrName,
      }
    }
    else {
      where = {
        userName: userIdOrName,
      }
    }
    return await this.find(where)
  }

  async find(where: Partial<RawUser>) {
    const options: FindOptions<RawUser> = {
      where: { ...where },
      include: [
        {
          model: Role,
          attributes: ['name', 'alias'],
          through: { attributes: [] },
          include: [{
            model: Privilege,
            attributes: ['id', 'type'],
            through: { attributes: [] },
          }],
        },
        {
          model: Group,
          attributes: ['name', 'alias'],
          include: [{
            model: Role,
            through: { attributes: [] },
            include: [{
              model: Privilege,
              attributes: ['id', 'type'],
            }],
          }],
        },
      ],
    }
    const user = await this.userModel.findOne(options)
    if (!user) {
      this.logger.error('用户不存在')
      return null
    }
    const rawUser = user.get({ plain: true })
    // 合并角色并去重
    const allRoles = [
      ...user.roles,
      ...user.groups.flatMap(g => g.roles),
    ]
    const uniqueRoles = Array.from(
      new Map(allRoles.map(r => [r.name, r])).values(),
    )
    const allPrivileges = uniqueRoles.flatMap(r => r.privileges)
    const uniquePrivileges = Array.from(
      new Map(allPrivileges.map(p => [p.id, p])).values(),
    )
    // 构建最终结果
    rawUser.roles = uniqueRoles.map(role => ({
      name: role.name,
      alias: role.alias,
    }))
    rawUser.groups = user.groups.map(g => ({
      alias: g.alias,
      name: g.name,
    }))
    rawUser.privileges = uniquePrivileges.map(p => ({
      id: p.id,
      type: p.type,
    }))
    await this.userStore.setUser(rawUser)
    return rawUser
  }

  async findAllByPage(pageIndex: number = 1, pageSize: number = 10): Promise<PublicUser[]> {
    return this.userModel.findAll({
      offset: (pageIndex - 1) * pageSize,
      limit: pageSize,
      order: [['userId', 'DESC']],
      attributes: {
        exclude: ['passwd', 'passwdSalt'],
      },
      raw: true,
    })
  }

  async searchUserName(userName: string, limit: number = 10): Promise<MinimalUser[]> {
    if (!userName)
      return []

    const users = await this.userModel.findAll({
      where: {
        userName: {
          [Op.like]: `%${userName}%`,
        },
        status: UserStatus.ENABLED,
      },
      attributes: ['userId', 'userName', 'nickName'],
      order: [['userId', 'DESC']],
      limit,
      raw: true,
    })
    return users.map(user => ({
      userId: user.userId,
      userName: user.userName,
      nickName: user.nickName,
    }))
  }

  async activateUser(userId: number, updateUserId?: number): Promise<RawUser> {
    const user = await this.userModel.findByPk(userId)
    if (!user) {
      this.logger.error('用户不存在')
      throw new Error('用户不存在')
    }
    if (user.status === UserStatus.ENABLED) {
      this.logger.error('用户已激活')
      throw new Error('用户已激活')
    }
    await user.update({
      status: UserStatus.ENABLED,
      updateBy: updateUserId ?? userId,
    })
    await this.userStore.removeUser(user)
    return this.findOne(userId)
  }

  async disableUser(userId: number, updateUserId?: number) {
    const user = await this.userModel.findByPk(userId)
    if (!user) {
      this.logger.error('用户不存在')
      throw new Error('用户不存在')
    }
    if (user.status === UserStatus.DISABLED) {
      this.logger.error('用户已禁用')
      return this.findOne(userId)
    }
    await user.update({
      status: UserStatus.DISABLED,
      updateBy: updateUserId ?? userId,
    })
    await this.userStore.removeUser(user)
    await this.deviceStore.removeDevice(userId, {
      all: true,
    })
    return this.findOne(userId)
  }

  async updateUser(userProfile: Partial<RawUser>, updateUserId?: number): Promise<RawUser> {
    const { userId, ...profile } = userProfile
    const user = await this.userModel.findByPk(userId)
    if (!user) {
      this.logger.error('用户不存在')
      throw new Error('用户不存在')
    }
    await this.userStore.removeUser(user)
    await user.update({
      ...profile,
      updateBy: updateUserId ?? userId,
    })
    return this.findOne(userId)
  }

  async removeUser(userId: number) {
    const user = await this.userModel.findByPk(userId)
    if (!user) {
      this.logger.error('用户不存在')
      throw new Error('用户不存在')
    }
    await user.destroy()
    await this.userStore.removeUser(user)
    return true
  }

  normalizeUserInfo(userProfile: RegisterUser | UpdateUser) {
    if (userProfile.userName) {
      if (!userProfile.userName.trim()) {
        throw new Error('用户名值非法')
      }
      userProfile.userName = userProfile.userName.trim().toLowerCase()
    }
    if (userProfile.nickName) {
      if (!userProfile.nickName.trim()) {
        throw new Error('昵称值非法')
      }
      userProfile.nickName = userProfile.nickName.trim()
    }
    if (userProfile.email) {
      if (!userProfile.email.trim()) {
        throw new Error('邮箱值非法')
      }
      userProfile.email = userProfile.email.trim().toLowerCase()
      if (!REGEX_EMAIL.test(userProfile.email)) {
        throw new Error('邮箱值非法')
      }
    }
    if (userProfile.mobile) {
      if (!userProfile.mobile.trim()) {
        throw new Error('手机号值非法')
      }
      userProfile.mobile = userProfile.mobile.trim()
      if (!REGEX_MOBILE_PHONE.test(userProfile.mobile)) {
        throw new Error('手机号值非法')
      }
    }
  }

  async checkUser(user: RawUser, passwd: string = '', checkStatus = true): Promise<boolean> {
    if (user == null) {
      this.logger.error('用户不存在')
      return false
    }
    let checkResult: boolean
    if (!user.passwdSalt) {
      checkResult = await bcrypt.compare(passwd, user.passwd)
    }
    else {
      checkResult = user.passwd === encryptPassword(passwd, user.passwdSalt)
    }
    if (!checkResult) {
      this.logger.error('密码错误')
      return false
    }
    if (!checkStatus) {
      return true
    }
    if (user.status === UserStatus.DEACTIVATED) {
      this.logger.error('用户待激活')
      throw new Error('用户待激活')
    }
    else if (user.status === UserStatus.DISABLED) {
      this.logger.error('用户已禁用')
      throw new Error('用户已禁用')
    }
    return true
  }
}

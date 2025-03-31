import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { FindOptions, Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { Group, Privilege, PublicUser, RawUser, Role, User } from '~entities/user'
import { RedisCacheService } from '~modules/core/redisCache/redis-cache.service'
import { UserStatus } from './variables/user.status'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    private sequelize: Sequelize,
    private readonly redisCacheService: RedisCacheService,
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
    const cached = await this._getCache(userIdOrName)
    if (cached) {
      this._setCache(cached)
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
    this._setCache(rawUser).then()
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

  async searchUserName(userName: string, limit: number = 10): Promise<Pick<PublicUser, 'userId' | 'userName' | 'nickName'>[]> {
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

  async activateUser(userId: number, updateUserId: number): Promise<RawUser> {
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
      updateBy: updateUserId,
    })
    await this._clearCache(user)
    return this.findOne(userId)
  }

  async disableUser(userId: number, updateUserId: number) {
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
      updateBy: updateUserId,
    })
    await this._clearCache(user)
    return this.findOne(userId)
  }

  async updateUser(userProfile: Partial<RawUser>): Promise<RawUser> {
    const { userId, ...profile } = userProfile
    const user = await this.userModel.findByPk(userId)
    if (!user) {
      this.logger.error('用户不存在')
      throw new Error('用户不存在')
    }
    const oldUser = user.get({
      plain: true,
    })
    await user.update(profile)
    await this._clearCache(oldUser)
    return this.findOne(userId)
  }

  async removeUser(userId: number) {
    const user = await this.userModel.findByPk(userId)
    if (!user) {
      this.logger.error('用户不存在')
      throw new Error('用户不存在')
    }
    await user.destroy()
    await this._clearCache(user)
    return true
  }

  async _getCache(userIdOrName: string | number): Promise<RawUser | null> {
    if (typeof userIdOrName === 'number') {
      const cacheKey = `user:userId:${userIdOrName}`
      return await this.redisCacheService.get<RawUser>(cacheKey)
    }
    else {
      const userIdKey = `user:userName:${userIdOrName}:userId`
      const cachedUserId = await this.redisCacheService.get<number>(userIdKey)
      if (!cachedUserId) {
        return null
      }
      const cacheKey = `user:userId:${cachedUserId}`
      return await this.redisCacheService.get<RawUser>(cacheKey)
    }
  }

  async _setCache(user: RawUser): Promise<void> {
    await this.redisCacheService.set(`user:userId:${user.userId}`, user, 60 * 60 * 1000)
    await this.redisCacheService.set(`user:userName:${user.userName}:userId`, user.userId, 60 * 60 * 1000)
  }

  async _clearCache(user: RawUser): Promise<void> {
    await this.redisCacheService.del(`user:userId:${user.userId}`)
    await this.redisCacheService.del(`user:userName:${user.userName}:userId`)
  }
}

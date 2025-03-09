import type { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { FindOptions, Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { Group } from '~entities/user/group.model'
import { Privilege } from '~entities/user/privilege.model'
import { Role } from '~entities/user/role.model'
import { PublicUser, RawUser, User } from '~entities/user/user.model'
import { UserStatus } from './variables/user.status'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    private sequelize: Sequelize,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
        })
      }
    })
    return userItem.get({
      plain: true,
    })
  }

  async findOne(userIdOrName: string | number, withPrivileges: boolean = false): Promise<RawUser> {
    let where: Partial<RawUser>
    let cacheKey: string
    if (typeof userIdOrName === 'number') {
      where = {
        userId: userIdOrName,
      }
      cacheKey = `user:userId:${userIdOrName}`
    }
    else {
      where = {
        userName: userIdOrName,
      }
      cacheKey = `user:userName:${userIdOrName}`
    }
    const cached = await this.cacheManager.get<RawUser>(cacheKey)
    if (cached) {
      if (withPrivileges) {
        if (cached.privileges) {
          setImmediate(() => {
            this.cacheManager.set(cacheKey, cached, 60 * 60 * 1000)
          })
          return cached
        }
      }
      else {
        setImmediate(() => {
          this.cacheManager.set(cacheKey, cached, 60 * 60 * 1000)
        })
        const { roles, groups, privileges, ...rawUser } = cached
        return rawUser
      }
    }
    return await this.find(where, withPrivileges)
  }

  async findOneByGithub(github: string): Promise<RawUser> {
    return await this.find({
      github,
    }, true)
  }

  async find(where: Partial<RawUser>, withPrivileges: boolean = false) {
    const options: FindOptions<RawUser> = {
      where: { ...where },
    }
    if (withPrivileges) {
      options.include = [
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
      ]
    }
    const user = await this.userModel.findOne(options)
    if (!user) {
      return null
    }
    const rawUser = user.get({ plain: true })
    if (!withPrivileges) {
      setImmediate(() => {
        this.cacheManager.set(`user:userId:${rawUser.userId}`, rawUser, 60 * 60 * 1000)
        this.cacheManager.set(`user:userName:${rawUser.userName}`, rawUser, 60 * 60 * 1000)
      })
      return rawUser
    }
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
    setImmediate(() => {
      this.cacheManager.set(`user:userId:${rawUser.userId}`, rawUser, 60 * 60 * 1000)
      this.cacheManager.set(`user:userName:${rawUser.userName}`, rawUser, 60 * 60 * 1000)
    })
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

  async activateUser(userId: number): Promise<RawUser> {
    const user = await this.userModel.findOne({ where: { userId } })
    if (user == null)
      throw new Error('User not found')
    if (user.status === UserStatus.ENABLED)
      throw new Error('User is already enabled')
    await user.update({ status: UserStatus.ENABLED })
    return user.get({
      plain: true,
    })
  }

  async disableUser(userId: number) {
    await this.userModel.update({ status: UserStatus.DISABLED }, { where: { userId } })
    return true
  }

  async updateUser(userProfile: Partial<RawUser>): Promise<RawUser> {
    const { userId, ...profile } = userProfile
    const user = await this.userModel.findByPk(userId)
    if (!user) {
      this.logger.error('用户不存在')
      throw new Error('用户不存在')
    }
    await user.update(profile)
    return user.get({
      plain: true,
    })
  }

  async removeUser(userId: number) {
    await this.userModel.destroy({ where: { userId } })
    return true
  }
}

import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Sequelize } from 'sequelize-typescript'
import { Op } from 'sequelize'
import { UserStatus } from './variables/user.status'
import { User } from '~entities/user/user.model'
import { Role } from '~entities/user/role.model'
import { Privilege } from '~entities/user/privilege.model'
import { encryptPassword, makeSalt } from '~utils/cryptogram'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    private sequelize: Sequelize,
  ) {}

  private readonly logger = new Logger(UserService.name)

  async create(user: Partial<User>, userId?: number): Promise<User> {
    return await this.sequelize.transaction(async (t) => {
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
  }

  async findOne(userName: string | number): Promise<User> {
    return this.userModel.findOne({
      where: {
        userName,
      },
      include: [
        {
          model: Role,
          attributes: ['name', 'alias'],
          through: {
            attributes: [],
          },
          include: [
            {
              model: Privilege,
              attributes: ['type'],
              through: {
                attributes: [],
              },
            },
          ],
        },
      ],
    })
  }

  async findAllByPage(pageIndex: number = 1, pageSize: number = 10): Promise<User[]> {
    return this.userModel.findAll({
      include: [
        {
          model: Role,
          attributes: ['name', 'alias'],
          through: {
            attributes: [],
          },
          include: [
            {
              model: Privilege,
              attributes: ['type'],
              through: {
                attributes: [],
              },
            },
          ],
        },
      ],
      offset: (pageIndex - 1) * pageSize,
      limit: pageSize,
      order: [['userId', 'DESC']],
    })
  }

  async searchUserName(userName: string, limit: number = 10): Promise<Pick<User, 'userId' | 'userName' | 'nickName'>[]> {
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

  async activateUser(userId: number) {
    const user = await this.userModel.findOne({ where: { userId } })
    if (user == null)
      throw new Error('User not found')
    if (user.status === UserStatus.ENABLED)
      throw new Error('User is already enabled')
    return user.update({ status: UserStatus.ENABLED })
  }

  async disableUser(userId: number) {
    return this.userModel.update({ status: UserStatus.DISABLED }, { where: { userId } })
  }

  async checkUser(userId: number, passwd: string) {
    const user = await this.userModel.findByPk(userId)
    if (user == null)
      throw new Error('User not found')
    if (user.passwd === encryptPassword(passwd, user.passwdSalt))
      return true
    else
      throw new Error('Incorrect password')
  }

  async updateUser(userProfile: Partial<User>) {
    try {
      return await this.sequelize.transaction(async (t) => {
        const user = await this.userModel.findByPk(userProfile.userId)
        if (user) {
          delete userProfile.userId
          delete userProfile.passwdSalt
          delete userProfile.createBy
          delete userProfile.createdAt
          delete userProfile.updatedAt
          if (userProfile.passwd) {
            userProfile.passwdSalt = makeSalt()
            userProfile.passwd = encryptPassword(
              userProfile.passwd,
              userProfile.passwdSalt,
            )
          }
          await user.update(userProfile, { transaction: t })
          const { passwd, passwdSalt, ...result } = user.get({
            plain: true,
          })
          return result as Partial<User>
        }
        else {
          this.logger.error('用户不存在')
          throw new Error('用户不存在')
        }
      })
    }
    catch (e) {
      throw new Error(e.message)
    }
  }

  removeUser(userId: number) {
    return this.userModel.destroy({ where: { userId } })
  }
}

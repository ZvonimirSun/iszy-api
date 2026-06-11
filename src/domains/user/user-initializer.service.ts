import type { Transaction } from 'sequelize'
import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Sequelize } from 'sequelize-typescript'
import { Logger } from '~shared'
import { BUILT_IN_ROLES } from './constants'
import { Role, User, UserRole } from './entities'

@Injectable()
export class UserInitializerService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(Role) private readonly roleModel: typeof Role,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(UserRole) private readonly userRoleModel: typeof UserRole,
    private readonly sequelize: Sequelize,
  ) {}

  private readonly logger = new Logger(UserInitializerService.name)

  async onApplicationBootstrap() {
    await this.sequelize.transaction(async (transaction) => {
      await this.ensureBuiltInRoles(transaction)
      await this.ensureDefaultRolesForUsers(transaction)
    })
  }

  private async ensureBuiltInRoles(transaction: Transaction) {
    for (const roleConfig of BUILT_IN_ROLES) {
      const role = await this.roleModel.findOne({
        where: { name: roleConfig.name },
        transaction,
      })
      if (!role) {
        await this.roleModel.create(roleConfig, { transaction })
        this.logger.audit('内置角色已初始化', { roleName: roleConfig.name })
        continue
      }

      // 初始化只修复系统身份字段，避免覆盖后台维护的别名、描述和权限配置。
      if (role.isBuiltIn !== roleConfig.isBuiltIn || role.isDefault !== roleConfig.isDefault) {
        await role.update({
          isBuiltIn: roleConfig.isBuiltIn,
          isDefault: roleConfig.isDefault,
        }, { transaction })
        this.logger.audit('内置角色标记已补齐', { roleName: roleConfig.name })
      }
    }
  }

  private async ensureDefaultRolesForUsers(transaction: Transaction) {
    const defaultRoles = await this.roleModel.findAll({
      where: { isDefault: true },
      transaction,
    })
    if (!defaultRoles.length)
      return

    const users = await this.userModel.findAll({
      attributes: ['userId'],
      transaction,
    })
    let createdCount = 0
    for (const user of users) {
      for (const role of defaultRoles) {
        const [, created] = await this.userRoleModel.findOrCreate({
          where: {
            userId: user.userId,
            roleId: role.id,
          },
          defaults: {
            userId: user.userId,
            roleId: role.id,
          },
          transaction,
        })
        if (created)
          createdCount += 1
      }
    }
    if (createdCount) {
      this.logger.audit('用户默认角色关联已补齐', {
        userCount: users.length,
        roleCount: defaultRoles.length,
        createdCount,
      })
    }
  }
}

import type { Transaction } from 'sequelize'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import {
  PublicUser,
  RawGroup,
  RawPrivilege,
  RawRole,
  RawUser,
  REGEX_EMAIL,
  REGEX_MOBILE_PHONE,
  RegisterUser,
  UpdateUser,
  UserStatus,
} from '@zvonimirsun/iszy-common'
import bcrypt from 'bcrypt'
import { Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { DeviceStore } from '~domains/auth/store/device-store'
import { Logger, MinimalUser } from '~shared'
import { Group, Privilege, Role, User } from './entities'
import { UserStore } from './store/user-store'
import { encryptPassword } from './utils/cryptogram'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Role) private roleModel: typeof Role,
    @InjectModel(Group) private groupModel: typeof Group,
    @InjectModel(Privilege) private privilegeModel: typeof Privilege,
    private sequelize: Sequelize,
    private readonly userStore: UserStore,
    private readonly deviceStore: DeviceStore,
  ) {}

  private readonly logger = new Logger(UserService.name)

  async create(user: Partial<RawUser>, userId?: number): Promise<RawUser> {
    const userItem = await this.sequelize.transaction(async (t) => {
      const transactionHost = { transaction: t }
      let userEntity: User
      if (userId != null) {
        userEntity = await this.userModel.create(
          { ...user, createBy: userId, updateBy: userId },
          transactionHost,
        )
      }
      else {
        userEntity = await this.userModel.create(user, transactionHost)
        userEntity = await userEntity.update({
          createBy: userEntity.userId,
          updateBy: userEntity.userId,
        }, transactionHost)
      }
      const defaultRoles = await this.getDefaultRoles(transactionHost)
      if (defaultRoles.length)
        await userEntity.$add('roles', defaultRoles, transactionHost)
      // 新用户必须绑定默认角色，保证“已有账号即注册用户”的系统不变量。
      return userEntity
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

  async findForLogin(identifier: string): Promise<RawUser | null> {
    const normalizedIdentifier = identifier.trim().toLowerCase()
    const user = await this.findOne(normalizedIdentifier)
    if (user) {
      return user
    }
    if (!REGEX_EMAIL.test(normalizedIdentifier)) {
      return null
    }
    return this.find({ email: normalizedIdentifier })
  }

  async find(where: Partial<RawUser>) {
    const user = await this.userModel.findOne({
      where,
      include: [
        {
          model: Role,
          attributes: ['id', 'name', 'alias'],
          through: { attributes: [] },
        },
        {
          model: Group,
          attributes: ['id', 'name', 'alias'],
          through: { attributes: [] },
        },
      ],
    })

    if (!user) {
      return null
    }
    const userId = user.userId

    const directRoleIds = user.roles.map(r => r.id)

    // Users inherit roles from their direct groups and every parent group.
    const allGroupIds = await this.getGroupIdsWithRecursiveParent(userId)
    const groupRoleIds = allGroupIds.length
      ? (await this.roleModel.findAll({
          attributes: ['id'],
          include: [{
            model: Group,
            where: { id: allGroupIds },
            through: { attributes: [] },
          }],
        })).map(r => r.id)
      : []

    const allPermissionRoleIds = Array.from(new Set([...directRoleIds, ...groupRoleIds]))

    // Privileges are derived from the effective role set, not stored on users.
    const privileges = allPermissionRoleIds.length
      ? await this.privilegeModel.findAll({
          include: [{
            model: Role,
            where: { id: allPermissionRoleIds },
            through: { attributes: [] },
          }],
        })
      : []
    const uniquePrivileges = Array.from(
      new Map(privileges.map(p => [p.id, p])).values(),
    )

    const rawUser = user.get({ plain: true })
    rawUser.roles = (rawUser.roles ?? []).map(role => ({
      name: role.name,
      alias: role.alias,
    }))
    rawUser.groups = (rawUser.groups ?? []).map(g => ({
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

  async getGroupIdsWithRecursiveParent(userId: number): Promise<number[]> {
    const groupMap = new Map<number, boolean>()
    // 查用户直接组
    const groups = await this.groupModel.findAll({
      include: [{ model: User, where: { userId }, through: { attributes: [] } }],
    })

    const stack = [...groups]
    while (stack.length) {
      const g = stack.pop()!
      if (groupMap.has(g.id))
        continue
      groupMap.set(g.id, true)

      if (g.parentId) {
        const parent = await this.groupModel.findByPk(g.parentId)
        if (parent)
          stack.push(parent)
      }
    }

    return Array.from(groupMap.keys())
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
      throw new Error('用户不存在')
    }
    if (user.status === UserStatus.ENABLED) {
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
      throw new Error('用户不存在')
    }
    if (user.status === UserStatus.DISABLED) {
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
      throw new Error('用户不存在')
    }
    await this.userStore.removeUser(user)
    await user.update({
      ...profile,
      updateBy: updateUserId ?? userId,
    })
    return this.findOne(userId)
  }

  async bindSsoIfUnbound(userId: number, sso: string, nickName?: string): Promise<RawUser | null> {
    const user = await this.userModel.findByPk(userId)
    if (!user) {
      throw new Error('用户不存在')
    }

    const updateProfile: Partial<RawUser> = {
      sso,
      updateBy: userId,
    }
    if (nickName) {
      updateProfile.nickName = nickName
    }

    const [affectedCount] = await this.userModel.update(updateProfile, {
      where: {
        userId,
        sso: null,
      },
    })
    if (affectedCount !== 1) {
      return null
    }

    await this.userStore.removeUser(user)
    return this.findOne(userId)
  }

  async removeUser(userId: number) {
    const user = await this.userModel.findByPk(userId)
    if (!user) {
      throw new Error('用户不存在')
    }
    await this.sequelize.transaction(async (t) => {
      const transactionHost = { transaction: t }
      // 删除用户时允许清理默认角色关联；默认角色保护只约束用户角色编辑接口。
      await user.$set('roles', [], transactionHost)
      await user.$set('groups', [], transactionHost)
      await user.destroy(transactionHost)
    })
    await this.userStore.removeUser(user)
    await this.deviceStore.removeDevice(userId, { all: true })
    return true
  }

  async findAllRoles(): Promise<RawRole[]> {
    return this.roleModel.findAll({
      include: [{ model: Privilege, through: { attributes: [] } }],
      order: [['id', 'ASC']],
    })
  }

  async findRoleById(id: number): Promise<RawRole> {
    const role = await this.roleModel.findByPk(id, {
      include: [{ model: Privilege, through: { attributes: [] } }],
    })
    if (!role)
      throw new Error('角色不存在')
    return role.get({ plain: true })
  }

  async createRole(roleDto: RawRole): Promise<RawRole> {
    this.assertSystemRoleFieldsNotSet(roleDto)
    const role = await this.roleModel.create(roleDto)
    return this.findRoleById(role.id)
  }

  async updateRole(id: number, roleDto: Partial<RawRole>): Promise<RawRole> {
    const role = await this.roleModel.findByPk(id)
    if (!role)
      throw new Error('角色不存在')
    this.assertSystemRoleFieldsNotSet(roleDto)
    if (role.isBuiltIn && roleDto.name && roleDto.name !== role.name)
      throw new Error('内置角色不允许修改角色名')
    await role.update(roleDto)
    await this.removeUsersCacheByRoleIds([id])
    return this.findRoleById(id)
  }

  async removeRole(id: number): Promise<boolean> {
    const role = await this.roleModel.findByPk(id)
    if (!role)
      throw new Error('角色不存在')
    if (role.isBuiltIn)
      throw new Error('内置角色不允许删除')
    await this.removeUsersCacheByRoleIds([id])
    // Clear join rows first so role deletion does not depend on DB cascade config.
    await role.$set('users', [])
    await role.$set('groups', [])
    await role.$set('privileges', [])
    await role.destroy()
    return true
  }

  async setRolePrivileges(roleId: number, privilegeIds: number[]): Promise<RawRole> {
    const role = await this.roleModel.findByPk(roleId)
    if (!role)
      throw new Error('角色不存在')
    const privileges = await this.getPrivilegesByIds(privilegeIds)
    await role.$set('privileges', privileges)
    await this.removeUsersCacheByRoleIds([roleId])
    return this.findRoleById(roleId)
  }

  async setRoleUsers(roleId: number, userIds: number[]): Promise<RawRole> {
    const role = await this.roleModel.findByPk(roleId)
    if (!role)
      throw new Error('角色不存在')
    this.assertDefaultRoleNotModified(role)
    const users = await this.getUsersByIds(userIds)
    const previousUsers = await this.userModel.findAll({
      include: [{ model: Role, where: { id: roleId }, through: { attributes: [] } }],
    })
    await role.$set('users', users)
    await this.removeUsersCache([...previousUsers, ...users])
    return this.findRoleById(roleId)
  }

  async setRoleGroups(roleId: number, groupIds: number[]): Promise<RawRole> {
    const role = await this.roleModel.findByPk(roleId)
    if (!role)
      throw new Error('角色不存在')
    const groups = await this.getGroupsByIds(groupIds)
    await this.removeUsersCacheByRoleIds([roleId])
    await role.$set('groups', groups)
    await this.removeUsersCacheByGroupIds(groupIds)
    return this.findRoleById(roleId)
  }

  async findAllGroups(): Promise<RawGroup[]> {
    return this.groupModel.findAll({
      include: [{ model: Role, through: { attributes: [] } }],
      order: [['id', 'ASC']],
    })
  }

  async findGroupById(id: number): Promise<RawGroup> {
    const group = await this.groupModel.findByPk(id, {
      include: [{ model: Role, through: { attributes: [] } }],
    })
    if (!group)
      throw new Error('用户组不存在')
    return group.get({ plain: true })
  }

  async createGroup(groupDto: RawGroup): Promise<RawGroup> {
    if (groupDto.parentId)
      await this.assertGroupExists(groupDto.parentId)
    const group = await this.groupModel.create(groupDto)
    return this.findGroupById(group.id)
  }

  async updateGroup(id: number, groupDto: Partial<RawGroup>): Promise<RawGroup> {
    const group = await this.groupModel.findByPk(id)
    if (!group)
      throw new Error('用户组不存在')
    if (groupDto.parentId === id)
      throw new Error('用户组父级不能是自身')
    if (groupDto.parentId) {
      await this.assertGroupExists(groupDto.parentId)
      // Prevent loops in the group tree before moving this node.
      const descendantGroupIds = await this.getDescendantGroupIds([id])
      if (descendantGroupIds.includes(groupDto.parentId))
        throw new Error('用户组父级不能是自身的子级')
    }
    await group.update(groupDto)
    await this.removeUsersCacheByGroupIds([id])
    return this.findGroupById(id)
  }

  async removeGroup(id: number): Promise<boolean> {
    const group = await this.groupModel.findByPk(id)
    if (!group)
      throw new Error('用户组不存在')
    const childCount = await this.groupModel.count({ where: { parentId: id } })
    if (childCount)
      throw new Error('请先删除子用户组')
    await this.removeUsersCacheByGroupIds([id])
    // Clear join rows first so group deletion does not depend on DB cascade config.
    await group.$set('users', [])
    await group.$set('roles', [])
    await group.destroy()
    return true
  }

  async setGroupRoles(groupId: number, roleIds: number[]): Promise<RawGroup> {
    const group = await this.groupModel.findByPk(groupId)
    if (!group)
      throw new Error('用户组不存在')
    const roles = await this.getRolesByIds(roleIds)
    await group.$set('roles', roles)
    await this.removeUsersCacheByGroupIds([groupId])
    return this.findGroupById(groupId)
  }

  async setGroupUsers(groupId: number, userIds: number[]): Promise<RawGroup> {
    const group = await this.groupModel.findByPk(groupId)
    if (!group)
      throw new Error('用户组不存在')
    const users = await this.getUsersByIds(userIds)
    const previousUsers = await this.userModel.findAll({
      include: [{ model: Group, where: { id: groupId }, through: { attributes: [] } }],
    })
    await group.$set('users', users)
    await this.removeUsersCache([...previousUsers, ...users])
    return this.findGroupById(groupId)
  }

  async findAllPrivileges(): Promise<RawPrivilege[]> {
    return this.privilegeModel.findAll({
      order: [['id', 'ASC']],
    })
  }

  async findPrivilegeById(id: number): Promise<RawPrivilege> {
    const privilege = await this.privilegeModel.findByPk(id)
    if (!privilege)
      throw new Error('权限不存在')
    return privilege.get({ plain: true })
  }

  async createPrivilege(privilegeDto: RawPrivilege): Promise<RawPrivilege> {
    const privilege = await this.privilegeModel.create(privilegeDto)
    return privilege.get({ plain: true })
  }

  async updatePrivilege(id: number, privilegeDto: Partial<RawPrivilege>): Promise<RawPrivilege> {
    const privilege = await this.privilegeModel.findByPk(id)
    if (!privilege)
      throw new Error('权限不存在')
    await privilege.update(privilegeDto)
    const roles = await this.roleModel.findAll({
      attributes: ['id'],
      include: [{ model: Privilege, where: { id }, through: { attributes: [] } }],
    })
    await this.removeUsersCacheByRoleIds(roles.map(role => role.id))
    return this.findPrivilegeById(id)
  }

  async setPrivilegeRoles(privilegeId: number, roleIds: number[]): Promise<RawPrivilege> {
    const privilege = await this.privilegeModel.findByPk(privilegeId)
    if (!privilege)
      throw new Error('权限不存在')
    const roles = await this.getRolesByIds(roleIds)
    const previousRoles = await this.roleModel.findAll({
      attributes: ['id'],
      include: [{ model: Privilege, where: { id: privilegeId }, through: { attributes: [] } }],
    })
    await privilege.$set('roles', roles)
    await this.removeUsersCacheByRoleIds([
      ...previousRoles.map(role => role.id),
      ...roleIds,
    ])
    return this.findPrivilegeById(privilegeId)
  }

  async removePrivilege(id: number): Promise<boolean> {
    const privilege = await this.privilegeModel.findByPk(id)
    if (!privilege)
      throw new Error('权限不存在')
    // Capture affected roles before breaking the relation so their users can be invalidated.
    const roles = await this.roleModel.findAll({
      attributes: ['id'],
      include: [{ model: Privilege, where: { id }, through: { attributes: [] } }],
    })
    await this.removeUsersCacheByRoleIds(roles.map(role => role.id))
    await privilege.$set('roles', [])
    await privilege.destroy()
    return true
  }

  async setUserRoles(userId: number, roleIds: number[], updateUserId?: number): Promise<RawUser> {
    const user = await this.userModel.findByPk(userId)
    if (!user)
      throw new Error('用户不存在')
    const roles = await this.getRolesByIds(await this.withDefaultRoleIds(roleIds))
    // These assignment APIs intentionally replace the whole relation set.
    await user.$set('roles', roles)
    await user.update({ updateBy: updateUserId ?? userId })
    await this.userStore.removeUser(user)
    return this.findOne(userId)
  }

  async ensureUserRoleByName(userId: number, roleName: string, updateUserId?: number): Promise<RawUser> {
    const user = await this.userModel.findByPk(userId, {
      include: [{ model: Role, through: { attributes: [] } }],
    })
    if (!user)
      throw new Error('用户不存在')

    const role = await this.roleModel.findOne({ where: { name: roleName } })
    if (!role)
      throw new Error('角色不存在')

    if (!user.roles?.some(item => item.id === role.id)) {
      await user.$add('roles', role)
      await user.update({ updateBy: updateUserId ?? userId })
      await this.userStore.removeUser(user)
    }
    return this.findOne(userId)
  }

  async setUserGroups(userId: number, groupIds: number[], updateUserId?: number): Promise<RawUser> {
    const user = await this.userModel.findByPk(userId)
    if (!user)
      throw new Error('用户不存在')
    const groups = await this.getGroupsByIds(groupIds)
    // These assignment APIs intentionally replace the whole relation set.
    await user.$set('groups', groups)
    await user.update({ updateBy: updateUserId ?? userId })
    await this.userStore.removeUser(user)
    return this.findOne(userId)
  }

  private async getRolesByIds(roleIds: number[]): Promise<Role[]> {
    if (!roleIds.length)
      return []
    const roles = await this.roleModel.findAll({ where: { id: roleIds } })
    if (roles.length !== new Set(roleIds).size)
      throw new Error('角色不存在')
    return roles
  }

  private assertSystemRoleFieldsNotSet(roleDto: Partial<RawRole>): void {
    // 内置角色和默认角色只能由初始化逻辑维护，普通角色接口不允许写入这些系统标记。
    if ('isBuiltIn' in roleDto || 'isDefault' in roleDto)
      throw new Error('内置角色和默认角色标记不允许手动设置')
  }

  private async getDefaultRoles(options?: { transaction?: Transaction }): Promise<Role[]> {
    return this.roleModel.findAll({
      where: { isDefault: true },
      transaction: options?.transaction,
    })
  }

  private async withDefaultRoleIds(roleIds: number[]): Promise<number[]> {
    const defaultRoles = await this.getDefaultRoles()
    return Array.from(new Set([
      ...roleIds,
      ...defaultRoles.map(role => role.id),
    ]))
  }

  private assertDefaultRoleNotModified(role: Role): void {
    if (!role.isDefault)
      return
    throw new Error(`默认角色 ${role.name} 不允许修改用户绑定`)
  }

  private async getUsersByIds(userIds: number[]): Promise<User[]> {
    if (!userIds.length)
      return []
    const users = await this.userModel.findAll({ where: { userId: userIds } })
    if (users.length !== new Set(userIds).size)
      throw new Error('用户不存在')
    return users
  }

  private async getGroupsByIds(groupIds: number[]): Promise<Group[]> {
    if (!groupIds.length)
      return []
    const groups = await this.groupModel.findAll({ where: { id: groupIds } })
    if (groups.length !== new Set(groupIds).size)
      throw new Error('用户组不存在')
    return groups
  }

  private async getPrivilegesByIds(privilegeIds: number[]): Promise<Privilege[]> {
    if (!privilegeIds.length)
      return []
    const privileges = await this.privilegeModel.findAll({ where: { id: privilegeIds } })
    if (privileges.length !== new Set(privilegeIds).size)
      throw new Error('权限不存在')
    return privileges
  }

  private async assertGroupExists(groupId: number): Promise<void> {
    const group = await this.groupModel.findByPk(groupId)
    if (!group)
      throw new Error('父级用户组不存在')
  }

  private async removeUsersCacheByRoleIds(roleIds: number[]): Promise<void> {
    if (!roleIds.length)
      return
    // Role changes affect directly assigned users and users in groups using the roles.
    const directUsers = await this.userModel.findAll({
      include: [{ model: Role, where: { id: roleIds }, through: { attributes: [] } }],
    })
    const groups = await this.groupModel.findAll({
      attributes: ['id'],
      include: [{ model: Role, where: { id: roleIds }, through: { attributes: [] } }],
    })
    const groupIds = groups.map(group => group.id)
    // Child groups inherit parent group roles, so their users need invalidation too.
    const permissionGroupIds = groupIds.length
      ? Array.from(new Set([...groupIds, ...await this.getDescendantGroupIds(groupIds)]))
      : []
    const groupUsers = groups.length
      ? await this.userModel.findAll({
          include: [{ model: Group, where: { id: permissionGroupIds }, through: { attributes: [] } }],
        })
      : []
    await this.removeUsersCache([...directUsers, ...groupUsers])
  }

  private async removeUsersCacheByGroupIds(groupIds: number[]): Promise<void> {
    if (!groupIds.length)
      return
    // Group role changes propagate down the tree through inherited permissions.
    const permissionGroupIds = Array.from(new Set([...groupIds, ...await this.getDescendantGroupIds(groupIds)]))
    const users = await this.userModel.findAll({
      include: [{ model: Group, where: { id: permissionGroupIds }, through: { attributes: [] } }],
    })
    await this.removeUsersCache(users)
  }

  private async getDescendantGroupIds(groupIds: number[]): Promise<number[]> {
    const result = new Set<number>()
    const stack = [...groupIds]
    // Iterative traversal avoids recursion depth surprises in large group trees.
    while (stack.length) {
      const parentId = stack.pop()
      const children = await this.groupModel.findAll({
        attributes: ['id'],
        where: { parentId },
      })
      for (const child of children) {
        if (result.has(child.id))
          continue
        result.add(child.id)
        stack.push(child.id)
      }
    }
    return Array.from(result)
  }

  private async removeUsersCache(users: User[]): Promise<void> {
    const uniqueUsers = Array.from(new Map(users.map(user => [user.userId, user])).values())
    await Promise.all(uniqueUsers.map(user => this.userStore.removeUser(user)))
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
      return false
    }
    if (!user.passwd) {
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
      return false
    }
    if (!checkStatus) {
      return true
    }
    if (user.status === UserStatus.DEACTIVATED) {
      throw new Error('用户待激活')
    }
    else if (user.status === UserStatus.DISABLED) {
      throw new Error('用户已禁用')
    }
    return true
  }
}

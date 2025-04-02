import type { RawRole } from '@zvonimirsun/iszy-common'
import {
  AutoIncrement,
  BelongsToMany,
  Column,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript'
import { Group } from './group.model'
import { Privilege } from './privilege.model'
import { RoleGroup } from './role-group.model'
import { RolePrivilege } from './role-privilege.model'
import { User } from './user.model'
import { UserRole } from './user_role.model'

@Table
export class Role extends Model<RawRole> implements RawRole {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number

  @Column
  desc: string

  @Unique
  @Column
  name!: string

  @Column
  alias: string

  @BelongsToMany(() => User, () => UserRole)
  users: User[]

  @BelongsToMany(() => Group, () => RoleGroup)
  groups: Group[]

  @BelongsToMany(() => Privilege, () => RolePrivilege)
  privileges: Privilege[]
}

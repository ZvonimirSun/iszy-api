import {
  AutoIncrement,
  BelongsToMany,
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'
import { RoleGroup } from './role-group.model'
import { RawRole, Role } from './role.model'
import { UserGroup } from './user-group.model'
import { User } from './user.model'

export interface RawGroup {
  id?: number
  name: string
  alias: string
  parentId?: number
  roles?: RawRole[]
}

@Table
export class Group extends Model<RawGroup> implements RawGroup {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number

  @Column
  name!: string

  @Column
  alias!: string

  @ForeignKey(() => Group)
  @Column
  parentId?: number

  @BelongsToMany(() => User, () => UserGroup)
  users?: User[]

  @BelongsToMany(() => Role, () => RoleGroup)
  roles?: Role[]
}

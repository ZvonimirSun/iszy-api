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
import { Role } from './role.model'
import { UserGroup } from './user-group.model'
import { User } from './user.model'

@Table
export class Group extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id?: number

  @Column
  name!: string

  @ForeignKey(() => Group)
  @Column
  parentId?: number

  @BelongsToMany(() => User, () => UserGroup)
  users?: User[]

  @BelongsToMany(() => Role, () => RoleGroup)
  roles?: Role[]
}

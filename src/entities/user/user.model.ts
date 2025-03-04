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
import { Role } from './role.model'
import { UserGroup } from './user-group.model'
import { UserRole } from './user_role.model'

@Table
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  userId?: number

  @Unique
  @Column
  userName!: string

  @Column
  nickName!: string

  @Column
  passwd!: string

  @Column
  passwdSalt!: string

  @Unique
  @Column
  mobile?: string

  @Unique
  @Column
  email?: string

  @BelongsToMany(() => Role, () => UserRole)
  roles?: Role[]

  @BelongsToMany(() => Group, () => UserGroup)
  groups?: Group[]

  @Column
  status!: number

  @Column
  createBy!: number

  @Column
  updateBy!: number
}

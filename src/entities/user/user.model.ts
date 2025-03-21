import {
  AutoIncrement,
  BelongsToMany,
  Column,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript'
import { Group, RawGroup } from './group.model'
import { RawPrivilege } from './privilege.model'
import { RawRole, Role } from './role.model'
import { UserGroup } from './user-group.model'
import { UserRole } from './user_role.model'

export interface RawUser {
  userId: number
  userName: string
  nickName: string
  passwd: string
  passwdSalt?: string
  mobile?: string
  email?: string
  roles?: RawRole[]
  groups?: RawGroup[]
  status: number
  createBy: number
  updateBy: number
  privileges?: RawPrivilege[]
  github?: string
}

export type PublicUser = Omit<RawUser, 'passwd' | 'passwdSalt'>

@Table
export class User extends Model<RawUser> implements RawUser {
  @PrimaryKey
  @AutoIncrement
  @Column
  userId: number

  @Unique
  @Column
  userName: string

  @Column
  nickName: string

  @Column
  passwd: string

  @Column
  passwdSalt?: string

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
  status: number

  @Column
  createBy: number

  @Column
  updateBy: number

  @Unique
  @Column
  github?: string
}

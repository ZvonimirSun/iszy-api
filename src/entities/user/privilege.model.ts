import type { RawPrivilege } from '@zvonimirsun/iszy-common'
import {
  AutoIncrement,
  BelongsToMany,
  Column,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'
import { RolePrivilege } from './role-privilege.model'
import { Role } from './role.model'

@Table
export class Privilege extends Model<RawPrivilege> implements RawPrivilege {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number

  @Column
  type: string

  @BelongsToMany(() => Role, () => RolePrivilege)
  roles?: []
}

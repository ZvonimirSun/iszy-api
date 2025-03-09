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

export interface RawPrivilege {
  id?: number
  type: string
}

@Table
export class Privilege extends Model<RawPrivilege> implements RawPrivilege {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number

  @Column
  type: string

  @BelongsToMany(() => Role, () => RolePrivilege)
  roles?: []
}

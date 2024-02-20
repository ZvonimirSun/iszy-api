import {
  AutoIncrement,
  BelongsToMany,
  Column,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'
import { Role } from './role.model'
import { RolePrivilege } from './role-privilege.model'

@Table
export class Privilege extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id?: number

  @Column
  type: string

  @BelongsToMany(() => Role, () => RolePrivilege)
  roles?: []
}

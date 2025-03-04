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

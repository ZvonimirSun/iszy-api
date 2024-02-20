import {
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'
import { Role } from './role.model'
import { Privilege } from './privilege.model'

@Table
export class RolePrivilege extends Model {
  @ForeignKey(() => Role)
  @PrimaryKey
  @Column
  roleId: number

  @ForeignKey(() => Privilege)
  @PrimaryKey
  @Column
  privilegeId: number
}

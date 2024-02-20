import {
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'
import { Group } from './group.model'
import { Role } from './role.model'

@Table
export class RoleGroup extends Model {
  @ForeignKey(() => Group)
  @PrimaryKey
  @Column
  groupId: number

  @ForeignKey(() => Role)
  @PrimaryKey
  @Column
  roleId: number
}

import {
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'
import { Role } from './role.model'
import { User } from './user.model'

@Table
export class UserRole extends Model {
  @ForeignKey(() => User)
  @PrimaryKey
  @Column
  userId: number

  @ForeignKey(() => Role)
  @PrimaryKey
  @Column
  roleId: number
}

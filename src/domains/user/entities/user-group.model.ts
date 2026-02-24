import {
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'
import { Group } from './group.model'
import { User } from './user.model'

@Table
export class UserGroup extends Model {
  @ForeignKey(() => Group)
  @PrimaryKey
  @Column
  groupId: number

  @ForeignKey(() => User)
  @PrimaryKey
  @Column
  userId: number
}

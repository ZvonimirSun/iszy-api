import {
  AutoIncrement,
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'
import { User } from '~entities/user/user.model'

@Table
export class Settings extends Model {
  @AutoIncrement
  @PrimaryKey
  @Column
  id: number

  @ForeignKey(() => User)
  @Column
  userId: number

  @Column('jsonb')
  settings: any

  @Column
  key: string
}

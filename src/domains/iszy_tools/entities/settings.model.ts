import {
  AutoIncrement,
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'
import { User } from '~domains/user/entities'

@Table
export class Settings extends Model {
  @AutoIncrement
  @PrimaryKey
  @Column
  declare id: number

  @ForeignKey(() => User)
  @Column
  userId: number

  @Column('jsonb')
  settings: any

  @Column
  key: string
}

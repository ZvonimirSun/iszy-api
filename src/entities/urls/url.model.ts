import {
  Column,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'
import { User } from '~entities/user/user.model'

@Table({
  tableName: 'ShortUrlUrl',
})
export class UrlModel extends Model {
  @PrimaryKey
  @Column
  keyword: string

  @Column
  url: string

  @Column
  title: string

  @Column
  ip: string

  @Default(0)
  @Column
  clicks: number

  @ForeignKey(() => User)
  @Column
  userId: number
}

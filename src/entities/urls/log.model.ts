import {
  AutoIncrement,
  Column,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

@Table({
  tableName: 'ShortUrlLog',
})
export class LogModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number

  @Column
  shortUrl: string

  @Column
  referrer: string

  @Column
  user_agent: string

  @Column
  ip: string

  @Column
  code: string
}

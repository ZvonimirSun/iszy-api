import {
  AutoIncrement,
  Column,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript'

@Table({
  tableName: 'ShortUrlOptions',
  timestamps: false,
})
export class OptionsModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number

  @Unique
  @Column
  key: string

  @Column
  value: string
}

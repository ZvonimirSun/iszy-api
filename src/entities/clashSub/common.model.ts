import {
  AutoIncrement,
  Column,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

export interface RawCommon {
  id?: number
  name: string
  comment: string
  config: string
}

@Table({
  tableName: 'ClashCommon',
})
export class CommonConfig extends Model<RawCommon> implements RawCommon {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number

  @Column
  name!: string

  @Column
  comment!: string

  @Column
  config!: string
}

import { AutoIncrement, Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript'
import { CommonConfig } from './common.model'

export interface RawConfig {
  id?: number
  name: string
  comment: string
  common_id: number
  rules: string
}

@Table({
  tableName: 'ClashConfig',
})
export class Config extends Model<RawConfig> implements RawConfig {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number

  @Column
  name!: string

  @Column
  comment!: string

  @ForeignKey(() => CommonConfig)
  @Column
  common_id!: number

  @Column
  rules!: string
}

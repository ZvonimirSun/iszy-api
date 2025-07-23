import { AutoIncrement, Column, Model, PrimaryKey, Table } from 'sequelize-typescript'

export interface RawRuleTemplate {
  id?: number
  name: string
  comment: string
  config: string
}

@Table({
  tableName: 'ClashRuleTemplate',
})
export class RuleTemplate extends Model<RawRuleTemplate> implements RawRuleTemplate {
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

import { AutoIncrement, Column, Model, PrimaryKey, Table } from 'sequelize-typescript';

export interface RawProvider {
  id?: number
  name: string
  comment: string
  config: string
}

@Table({
  tableName: 'ClashProvider',
})
export class Provider extends Model<RawProvider> implements RawProvider {
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

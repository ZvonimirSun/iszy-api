import { AutoIncrement, Column, Model, PrimaryKey, Table } from 'sequelize-typescript'

export interface RawProxy {
  id?: number
  name: string
  comment: string
  config: string
}

@Table({
  tableName: 'ClashProxy',
})
export class Proxy extends Model<RawProxy> implements RawProxy {
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

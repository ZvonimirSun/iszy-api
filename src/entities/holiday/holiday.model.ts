import { Column, Model, PrimaryKey, Table } from 'sequelize-typescript'

@Table({
  timestamps: false,
})
export class Holiday extends Model {
  @PrimaryKey
  @Column
  id: number

  @Column
  desc: string

  @Column
  isHoliday: boolean

  @Column
  last: number
}

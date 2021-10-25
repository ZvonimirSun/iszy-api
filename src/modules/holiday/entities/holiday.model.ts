import { Model, Table, Column, PrimaryKey } from 'sequelize-typescript';

@Table({
  timestamps: false,
})
export class Holiday extends Model<Holiday> {
  @PrimaryKey
  @Column
  id: number;

  @Column
  desc: string;

  @Column
  isHoliday: boolean;

  @Column
  last: number;
}

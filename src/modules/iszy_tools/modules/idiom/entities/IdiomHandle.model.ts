import { Column, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table({
  timestamps: false,
})
export class IdiomHandle extends Model {
  @PrimaryKey
  @Column
  date: number;

  @Column
  idiom: string;
}

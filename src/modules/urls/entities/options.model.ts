import { Column, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table({
  tableName: 'ShortUrlOptions',
  timestamps: false,
})
export class OptionsModel extends Model {
  @PrimaryKey
  @Column
  id: number;

  @Column
  key: string;

  @Column
  value: string;
}

import { Column, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table({
  tableName: 'ShortUrlLog',
})
export class LogModel extends Model {
  @PrimaryKey
  @Column
  id: number;

  @Column
  shorturl: string;

  @Column
  referrer: string;

  @Column
  user_agent: string;

  @Column
  ip: string;

  @Column
  code: string;
}

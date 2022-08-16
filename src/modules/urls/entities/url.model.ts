import {
  Column,
  Default,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

@Table({
  tableName: 'ShortUrlUrl',
})
export class UrlModel extends Model {
  @PrimaryKey
  @Column
  keyword: string;

  @Column
  url: string;

  @Column
  title: string;

  @Column
  ip: string;

  @Default(0)
  @Column
  clicks: number;
}

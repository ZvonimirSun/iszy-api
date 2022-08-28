import { Column, Model, PrimaryKey, Table } from 'sequelize-typescript';

@Table
export class JsoneditorModel extends Model {
  @PrimaryKey
  @Column
  key: string;

  @Column
  name: string;

  @Column
  text: string;

  @Column('jsonb')
  json: any;
}

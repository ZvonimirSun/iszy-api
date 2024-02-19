import {
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { User } from '../../../../user/entities/user.model';

@Table
export class JsoneditorModel extends Model {
  @PrimaryKey
  @Column
  key: string;

  @Column
  name: string;

  @Column('text')
  text: string;

  @Column('jsonb')
  json: any;

  @ForeignKey(() => User)
  @Column
  userId: number;
}

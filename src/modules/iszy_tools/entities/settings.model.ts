import {
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { User } from '../../user/entities/user.model';

@Table
export class Settings extends Model {
  @ForeignKey(() => User)
  @PrimaryKey
  @Column
  userId: number;

  @Column('jsonb')
  settings: any;
}

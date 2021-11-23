import {
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { User } from '../../user/entities/user.model';

@Table({
  timestamps: false,
})
export class TronModel extends Model {
  @PrimaryKey
  @Column
  address: string;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @Column
  pk: string;
}

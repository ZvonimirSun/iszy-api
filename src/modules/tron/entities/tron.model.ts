import {
  Column,
  ForeignKey,
  Index,
  Model,
  PrimaryKey,
  Table,
  Unique,
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

  @Unique
  @Index
  @Column
  pk: string;
}

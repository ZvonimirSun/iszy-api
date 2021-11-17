import {
  Model,
  Table,
  Column,
  BelongsToMany,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Role } from './role.model';
import { UserRole } from './user_role.model';

@Table
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  userId?: number;

  @Column
  userName!: string;

  @Column
  nickName!: string;

  @Column
  passwd!: string;

  @Column
  passwdSalt!: string;

  @Column
  mobile!: string;

  @BelongsToMany(() => Role, () => UserRole)
  roles?: Role[];

  @Column
  userStatus!: number;

  @Column
  createBy!: number;

  @Column
  updateBy!: number;
}

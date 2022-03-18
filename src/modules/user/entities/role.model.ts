import {
  Model,
  Table,
  Column,
  PrimaryKey,
  AutoIncrement,
  BelongsToMany,
  Unique,
} from 'sequelize-typescript';
import { User } from './user.model';
import { UserRole } from './user_role.model';

@Table
export class Role extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id?: number;

  @Column
  desc: string;

  @Unique
  @Column
  name!: string;

  @Column
  alias: string;

  @BelongsToMany(() => User, () => UserRole)
  users: User[];
}

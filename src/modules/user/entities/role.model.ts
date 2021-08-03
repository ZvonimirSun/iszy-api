import {
  Model,
  Table,
  Column,
  PrimaryKey,
  AutoIncrement,
  BelongsToMany,
} from 'sequelize-typescript';
import { User } from './user.model';
import { UserRole } from './user_role.model';

@Table
export class Role extends Model<Role> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id?: number;

  @Column
  desc: string;

  @Column
  name!: string;

  @BelongsToMany(() => User, () => UserRole)
  users: User[];
}

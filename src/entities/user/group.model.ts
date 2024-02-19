import {
  AutoIncrement,
  BelongsToMany,
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { User } from './user.model';
import { UserGroup } from './user-group.model';
import { Role } from './role.model';
import { RoleGroup } from './role-group.model';

@Table
export class Group extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id?: number;

  @Column
  name!: string;

  @ForeignKey(() => Group)
  @Column
  parentId?: number;

  @BelongsToMany(() => User, () => UserGroup)
  users?: User[];

  @BelongsToMany(() => Role, () => RoleGroup)
  roles?: Role[];
}

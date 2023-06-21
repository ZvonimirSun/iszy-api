import {
  Model,
  Table,
  Column,
  PrimaryKey,
  BelongsTo,
  ForeignKey,
  DataType,
} from 'sequelize-typescript';
import { MockPrj } from './mock_prj.model';
import { User } from '../../auth/modules/user/entities/user.model';
@Table
export class MockData extends Model {
  @PrimaryKey
  @Column({
    autoIncrement: true,
  })
  id?: number;

  @Column({
    allowNull: false,
  })
  name!: string;

  @Column({
    allowNull: false,
  })
  type!: string;

  @Column({
    allowNull: false,
  })
  enabled!: boolean;

  @Column({
    allowNull: false,
  })
  path!: string;

  @Column({
    type: DataType.TEXT,
  })
  description?: string;

  @Column
  delay?: number;

  @Column({
    type: DataType.TEXT,
  })
  response?: string;

  @ForeignKey(() => MockPrj)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  projectId!: string;

  @BelongsTo(() => MockPrj)
  project: MockPrj;

  @ForeignKey(() => User)
  @Column({
    allowNull: false,
  })
  userId!: number;

  @BelongsTo(() => User)
  user!: User;
}

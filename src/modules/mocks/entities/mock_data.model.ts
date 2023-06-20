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
    unique: true,
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
}

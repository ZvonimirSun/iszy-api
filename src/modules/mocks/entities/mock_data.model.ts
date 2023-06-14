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
  @Column
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

  @ForeignKey(() => MockPrj)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  projectId: string;

  @BelongsTo(() => MockPrj)
  project: MockPrj;
}

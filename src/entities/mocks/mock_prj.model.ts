import {
  Model,
  Table,
  Column,
  PrimaryKey,
  NotNull,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '~entities/user/user.model';

@Table
export class MockPrj extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  id?: string;

  @Column({
    allowNull: false,
  })
  name!: string;

  @Column({
    allowNull: false,
  })
  path!: string;

  @Column
  description?: string;

  @ForeignKey(() => User)
  @Column({
    allowNull: false,
  })
  userId!: number;

  @BelongsTo(() => User)
  user!: User;
}

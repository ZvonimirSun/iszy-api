import {
  Table,
  Model,
  PrimaryKey,
  Column,
  Unique,
  AutoIncrement,
} from 'sequelize-typescript';

@Table({
  timestamps: false,
})
export class Idiom extends Model {
  @Column
  derivation: string;

  @Column
  example: string;

  @Column
  explanation: string;

  @Column
  pinyin: string;

  @Unique
  @Column
  word: string;

  @Column
  abbreviation: string;

  @AutoIncrement
  @PrimaryKey
  @Column
  id: number;
}

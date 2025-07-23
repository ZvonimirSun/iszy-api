import {
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'
import { Config } from './config.model'
import { Provider } from './provider.model'

@Table({
  tableName: 'ClashConfigProvider',
})
export class ConfigProviderModel extends Model {
  @ForeignKey(() => Config)
  @PrimaryKey
  @Column
  configId: number

  @ForeignKey(() => Provider)
  @PrimaryKey
  @Column
  providerId: number
}

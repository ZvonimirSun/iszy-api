import {
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'
import { Config } from './config.model'
import { Proxy } from './proxy.model'

@Table({
  tableName: 'ClashConfigProxy',
})
export class ConfigProxyModel extends Model {
  @ForeignKey(() => Config)
  @PrimaryKey
  @Column
  configId: number

  @ForeignKey(() => Proxy)
  @PrimaryKey
  @Column
  proxyId: number
}

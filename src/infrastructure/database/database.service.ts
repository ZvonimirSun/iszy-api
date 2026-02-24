import type { Dialect } from 'sequelize'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SequelizeModuleOptions } from '@nestjs/sequelize'

@Injectable()
export class DatabaseService {
  constructor(private readonly configService: ConfigService) {}

  private readonly logger = new Logger(DatabaseService.name)

  getConfig(): SequelizeModuleOptions {
    return {
      dialect: this.configService.get<Dialect>('database.type'),
      host: this.configService.get<string>('database.host'),
      port: this.configService.get<number>('database.port'),
      username: this.configService.get<string>('database.user'),
      password: this.configService.get<string>('database.password'),
      database: this.configService.get<string>('database.database'),
      models: [],
      pool: {
        max: this.configService.get<number>('database.connectionLimit'), // 连接池中最大连接数量
        min: 0, // 连接池中最小连接数量
        acquire: 30000,
        idle: 10000, // 如果一个线程 10 秒钟内没有被使用过的话，那么就释放线程
      },
      timezone: '+08:00',

      autoLoadModels: true,
      synchronize: true,
      logging: this.configService.get<boolean>('database.logging')
        ? (str) => {
            this.logger.log(str)
          }
        : false,
    }
  }
}

import type { Dialect } from 'sequelize'
import { Logger, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SequelizeModule } from '@nestjs/sequelize'

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule')

        return {
          dialect: configService.get<Dialect>('database.type'),
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.user'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.database'),
          models: [],
          pool: {
            max: configService.get<number>('database.connectionLimit'), // 连接池中最大连接数量
            min: 0, // 连接池中最小连接数量
            acquire: 30000,
            idle: 10000, // 如果一个线程 10 秒钟内没有被使用过的话，那么就释放线程
          },
          timezone: '+08:00',

          autoLoadModels: true,
          synchronize: true,
          logging: configService.get<boolean>('database.logging')
            ? (str) => {
                logger.log(str)
              }
            : false,
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}

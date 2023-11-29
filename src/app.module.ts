import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { Dialect } from 'sequelize/types';
import configs from './core/configs';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConnectionModule } from './modules/connection/connection.module';
import { AuthModule } from './modules/auth/auth.module';
import { HolidayModule } from './modules/holiday/holiday.module';
import { IszyToolsModule } from './modules/iszy_tools/iszy_tools.module';
import { GisModule } from './modules/gis/gis.module';
import { UrlsModule } from './modules/urls/urls.module';
import { MockModule } from './modules/mocks/mock.module';
import { CacheModule } from '@nestjs/cache-manager';

const logger = new Logger('Database');

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configs],
      cache: true,
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
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
          ? function (str) {
              logger.log(str);
            }
          : false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    HolidayModule,
    IszyToolsModule,
    GisModule,
    UrlsModule,
    ConnectionModule,
    MockModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

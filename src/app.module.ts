import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { HolidayModule } from './modules/holiday/holiday.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import db from '../config/db';
import { Dialect } from 'sequelize/types';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [db],
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
        logging: configService.get<boolean>('database.logging'),
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    HolidayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { SequelizeModule } from '@nestjs/sequelize';
import db from '../config/db';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: db.mysql.host,
      port: db.mysql.port,
      username: db.mysql.user,
      password: db.mysql.password || null,
      database: db.mysql.database,
      models: [],
      pool: {
        max: db.mysql.connectionLimit, // 连接池中最大连接数量
        min: 0, // 连接池中最小连接数量
        acquire: 30000,
        idle: 10000, // 如果一个线程 10 秒钟内没有被使用过的话，那么就释放线程
      },
      timezone: '+08:00',

      autoLoadModels: true,
      synchronize: true,
    }),
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

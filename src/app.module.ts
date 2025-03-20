import type { CacheModuleOptions } from '@nestjs/cache-manager'
import type { RedisOptions } from 'ioredis'
import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { SequelizeModule } from '@nestjs/sequelize'
import { AuthModule } from '~modules/auth/auth.module'
import { ConnectionModule } from '~modules/connection/connection.module'
import { ConnectionService } from '~modules/connection/connection.service'
import { DDNSModule } from '~modules/ddns/ddns.module'
import { GisModule } from '~modules/gis/gis.module'
import { HolidayModule } from '~modules/holiday/holiday.module'
import { IszyToolsModule } from '~modules/iszy_tools/iszy_tools.module'
import { MockModule } from '~modules/mocks/mock.module'
import { UrlsModule } from '~modules/urls/urls.module'
import configs from '~/configs'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (connectionService: ConnectionService): CacheModuleOptions<RedisOptions> => (connectionService.getCacheConfig()),
      inject: [ConnectionService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configs],
      cache: true,
    }),
    SequelizeModule.forRootAsync({
      useFactory: (connectionService: ConnectionService) => (connectionService.getSequelizeConfig()),
      inject: [ConnectionService],
    }),
    AuthModule,
    HolidayModule,
    IszyToolsModule,
    GisModule,
    UrlsModule,
    ConnectionModule,
    MockModule,
    DDNSModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

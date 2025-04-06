import { Module } from '@nestjs/common'
import { CoreModule } from '~modules/core/core.module'
import { DDNSModule } from '~modules/ddns/ddns.module'
import { GisModule } from '~modules/gis/gis.module'
import { HolidayModule } from '~modules/holiday/holiday.module'
import { IdiomModule } from '~modules/idiom/Idiom.module'
import { IszyToolsModule } from '~modules/iszy_tools/iszy_tools.module'
import { JsoneditorModule } from '~modules/jsonEditor/jsoneditor.module'
import { MockModule } from '~modules/mocks/mock.module'
import { UrlsModule } from '~modules/urls/urls.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [
    CoreModule,
    DDNSModule,
    GisModule,
    HolidayModule,
    IdiomModule,
    IszyToolsModule,
    JsoneditorModule,
    MockModule,
    UrlsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

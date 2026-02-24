import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { DDNSModule } from './ddns/ddns.module'
import { GisModule } from './gis/gis.module'
import { HolidayModule } from './holiday/holiday.module'
import { IdiomModule } from './idiom/Idiom.module'
import { IszyToolsModule } from './iszy_tools/iszy_tools.module'
import { JsoneditorModule } from './jsonEditor/jsoneditor.module'
import { MockModule } from './mocks/mock.module'
import { ThirdAuthModule } from './thirdAuth/third-auth.module'
import { UrlsModule } from './urls/urls.module'
import { UserModule } from './user/user.module'

@Module({
  imports: [
    AuthModule,
    ThirdAuthModule,
    UserModule,
    DDNSModule,
    GisModule,
    HolidayModule,
    IdiomModule,
    IszyToolsModule,
    JsoneditorModule,
    MockModule,
    UrlsModule,
  ],
})
export class DomainsModule {}

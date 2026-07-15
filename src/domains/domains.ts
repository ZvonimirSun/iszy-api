import { AuthModule } from './auth/auth.module'
import { DDNSModule } from './ddns/ddns.module'
import { FederatedAuthModule } from './federated-auth/federated-auth.module'
import { GisModule } from './gis/gis.module'
import { HolidayModule } from './holiday/holiday.module'
import { IdiomModule } from './idiom/Idiom.module'
import { IszyToolsModule } from './iszy_tools/iszy_tools.module'
import { JsoneditorModule } from './jsonEditor/jsoneditor.module'
import { MockModule } from './mocks/mock.module'
import { RtcModule } from './rtc/rtc.module'
import { UrlsModule } from './urls/urls.module'
import { UserModule } from './user/user.module'

export const Domains = [
  AuthModule,
  FederatedAuthModule,
  UserModule,
  DDNSModule,
  GisModule,
  HolidayModule,
  IdiomModule,
  IszyToolsModule,
  JsoneditorModule,
  MockModule,
  RtcModule,
  UrlsModule,
]

export const PublicDomains = [
  AuthModule,
  FederatedAuthModule,
  DDNSModule,
  GisModule,
  HolidayModule,
  MockModule,
  UrlsModule,
]

import { AuthModule } from './auth/auth.module'
import { DDNSModule } from './ddns/ddns.module'
import { GisModule } from './gis/gis.module'
import { HolidayModule } from './holiday/holiday.module'
import { IdiomModule } from './idiom/Idiom.module'
import { IszyToolsModule } from './iszy_tools/iszy_tools.module'
import { JsoneditorModule } from './jsonEditor/jsoneditor.module'
import { MockModule } from './mocks/mock.module'
import { OauthModule } from './oauth/oauth.module'
import { UrlsModule } from './urls/urls.module'
import { UserModule } from './user/user.module'

export const Domains = [
  AuthModule,
  OauthModule,
  UserModule,
  DDNSModule,
  GisModule,
  HolidayModule,
  IdiomModule,
  IszyToolsModule,
  JsoneditorModule,
  MockModule,
  UrlsModule,
]

export const PublicDomains = [
  AuthModule,
  DDNSModule,
  GisModule,
  HolidayModule,
  MockModule,
  UrlsModule,
]

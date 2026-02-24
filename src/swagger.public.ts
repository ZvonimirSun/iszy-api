import { AuthModule } from '~domains/auth/auth.module'
import { DDNSModule } from '~domains/ddns/ddns.module'
import { GisModule } from '~domains/gis/gis.module'
import { HolidayModule } from '~domains/holiday/holiday.module'
import { MockModule } from '~domains/mocks/mock.module'
import { UrlsModule } from '~domains/urls/urls.module'

export default [AuthModule, MockModule, GisModule, HolidayModule, UrlsModule, DDNSModule]

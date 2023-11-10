import { AuthModule } from './modules/auth/auth.module';
import { MockModule } from './modules/mocks/mock.module';
import { GisModule } from './modules/gis/gis.module';
import { HolidayModule } from './modules/holiday/holiday.module';
import { UrlsModule } from './modules/urls/urls.module';

export default [AuthModule, MockModule, GisModule, HolidayModule, UrlsModule];

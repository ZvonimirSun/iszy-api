import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import configs from '~/configs'
import { AuthModule } from './auth/auth.module'
import { ConnectionModule } from './connection/connection.module'
import { RedisCacheModule } from './redisCache/redis-cache.module'
import { ThirdAuthModule } from './thirdAuth/third-auth.module'
import { UserModule } from './user/user.module'

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configs],
      cache: true,
    }),
    AuthModule,
    ThirdAuthModule,
    UserModule,
    RedisCacheModule,
    ConnectionModule,
  ],
})
export class CoreModule {}

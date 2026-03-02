import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import configLoader from './configLoader'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [configLoader],
      cache: true,
    }),
  ],
})
export class ConfigLoadModule {}

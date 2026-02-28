import type { DatabaseConfig } from '~shared'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SequelizeModule } from '@nestjs/sequelize'
import { Logger } from '~shared'

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule')
        const config = configService.get<DatabaseConfig>('database')
        config.logging = config.logging
          ? (str) => {
              logger.log(str)
            }
          : false
        return config
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { DatabaseService } from './database.service'

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useFactory: (databaseService: DatabaseService) => (databaseService.getConfig()),
      inject: [DatabaseService],
    }),
  ],
  providers: [DatabaseService],
})
export class DatabaseModule {}

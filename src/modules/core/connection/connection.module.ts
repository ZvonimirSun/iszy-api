import { Global, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { ConnectionService } from './connection.service'

@Global()
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useFactory: (connectionService: ConnectionService) => (connectionService.getSequelizeConfig()),
      inject: [ConnectionService],
    }),
  ],
  providers: [ConnectionService],
  exports: [ConnectionService],
})
export class ConnectionModule {}

import { Module } from '@nestjs/common'
import { DomainsModule } from '~domains/domains.module'
import { InfrastructureModule } from '~/infrastructure/infrastructure.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [
    InfrastructureModule,
    DomainsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

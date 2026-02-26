import { Module } from '@nestjs/common'
import { DomainsModule } from '~domains/domains.module'
import { InfrastructureModule } from '~/infrastructure/infrastructure.module'
import { SharedModule } from '~/shared/shared.module'
import { AppController } from './app.controller'

@Module({
  imports: [
    SharedModule,
    InfrastructureModule,
    DomainsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

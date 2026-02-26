import { Module } from '@nestjs/common'
import { Domains } from './domains'

@Module({
  imports: Domains,
})
export class DomainsModule {}

import type { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import ms from 'ms'

@Injectable()
export class TicketStore {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async createTicket(userId: number) {
    const ticket = crypto.randomUUID()
    await this.cacheManager.set(`ticket:${ticket}`, userId, ms('5m'))
    return ticket
  }

  async checkTicket(ticket: string): Promise<number | null> {
    const userId = await this.cacheManager.get<number>(`ticket:${ticket}`)
    if (userId) {
      await this.cacheManager.del(`ticket:${ticket}`)
      return userId
    }
  }
}

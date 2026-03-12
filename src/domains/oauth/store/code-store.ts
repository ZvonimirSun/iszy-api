import type { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import ms from 'ms'
import { random } from '~shared'

@Injectable()
export class CodeStore {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async createCode(userId: number) {
    const ticket = random()
    await this.cacheManager.set(`ticket:${ticket}`, userId, ms('5m'))
    return ticket
  }

  async checkCode(ticket: string): Promise<number | null> {
    const userId = await this.cacheManager.get<number>(`ticket:${ticket}`)
    if (userId) {
      await this.cacheManager.del(`ticket:${ticket}`)
      return userId
    }
  }
}

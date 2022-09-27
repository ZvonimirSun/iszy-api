import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class ConnectionService {
  constructor(private readonly configService: ConfigService) {}

  private redisClient;
  private readonly logger = new Logger(ConnectionService.name);

  getRedis() {
    if (this.redisClient) {
      return this.redisClient;
    }
    try {
      this.redisClient = new Redis(
        this.configService.get<number>('redis.port'),
        this.configService.get<string>('redis.host'),
        {
          password: this.configService.get<string>('redis.password'),
        },
      );
      this.logger.log(
        `连接 Redis {redis://.:***@${this.configService.get<string>(
          'redis.host',
        )}:${this.configService.get<number>('redis.port')}} 成功`,
      );
    } catch (e) {
      this.logger.error('连接 Redis 失败，' + e.message);
    }
    return this.redisClient;
  }
}

import type { Device, DeviceCache, OptionalExcept, RawUser } from '@zvonimirsun/iszy-common'
import type { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import ms, { StringValue } from 'ms'

@Injectable()
export class RedisCacheService {
  private readonly refreshExpireTime: StringValue
  private readonly refreshExpireMs: number

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.refreshExpireTime = this.configService.get<StringValue>('auth.jwt.refreshExpire')
    this.refreshExpireMs = ms(this.refreshExpireTime)
  }

  async get<T>(key: string): Promise<T | null> {
    return this.cacheManager.get(key)
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<T> {
    return this.cacheManager.set(key, value, ttl)
  }

  async del(key: string): Promise<boolean> {
    return this.cacheManager.del(key)
  }

  async addDevice(userId: number, deviceCache: DeviceCache): Promise<void> {
    const cachedDevice = await this.get<DeviceCache>(`device:${deviceCache.id}`)
    if (cachedDevice) {
      deviceCache.createdAt = cachedDevice.createdAt
    }
    await this.set<DeviceCache>(`device:${deviceCache.id}`, deviceCache, this.refreshExpireMs)
    const devices = (await this.get<string[]>(`device:userId:${userId}`)) || []
    const newDevices = [deviceCache.id]
    for (const device of devices) {
      if (device === deviceCache.id) {
        continue
      }
      if (await this.get<DeviceCache>(`device:${device}`)) {
        newDevices.push(device)
      }
    }
    await this.set(`device:userId:${userId}`, newDevices, this.refreshExpireMs)
  }

  async getDevice(deviceId: string): Promise<DeviceCache | null> {
    return this.get<DeviceCache>(`device:${deviceId}`)
  }

  async removeDevice(userId: number, { deviceId, other, all }: {
    deviceId?: string
    other?: boolean
    all?: boolean
  } = {}): Promise<void> {
    const devices = (await this.get<string[]>(`device:userId:${userId}`)) || []
    // 登出所有设备
    if (all) {
      for (const device of devices) {
        await this.del(`device:${device}`)
      }
      await this.del(`device:userId:${userId}`)
    }
    // 登出其他设备
    else if (other) {
      for (const device of devices) {
        if (device !== deviceId) {
          await this.del(`device:${device}`)
        }
      }
      await this.set(`device:userId:${userId}`, [deviceId], this.refreshExpireMs)
    }
    // 登出当前设备
    else if (deviceId) {
      await this.del(`device:${deviceId}`)
      const newDevices: string[] = []
      for (const device of devices) {
        if (device === deviceId) {
          continue
        }
        if (await this.get<DeviceCache>(`device:${device}`)) {
          newDevices.push(device)
        }
      }
      if (newDevices.length) {
        await this.set(`device:userId:${userId}`, newDevices, this.refreshExpireMs)
      }
      else {
        await this.del(`device:userId:${userId}`)
      }
    }
  }

  async getDevices(userId: number): Promise<Device[]> {
    const deviceIds = (await this.get<string[]>(`device:userId:${userId}`)) || []
    const devices: Device[] = []
    for (const deviceId of deviceIds) {
      const deviceCache = await this.get<DeviceCache>(`device:${deviceId}`)
      if (deviceCache) {
        const { refreshToken, ...device } = deviceCache
        devices.push(device)
      }
    }
    return devices
  }

  async setUser(user: RawUser) {
    await this.set(`user:userId:${user.userId}`, user, 60 * 60 * 1000)
    await this.set(`user:userName:${user.userName}:userId`, user.userId, 60 * 60 * 1000)
  }

  async getUser(userIdOrName: string | number): Promise<RawUser | null> {
    if (typeof userIdOrName === 'number') {
      const cacheKey = `user:userId:${userIdOrName}`
      return this.get<RawUser>(cacheKey)
    }
    else {
      const userIdKey = `user:userName:${userIdOrName}:userId`
      const cachedUserId = await this.get<number>(userIdKey)
      if (!cachedUserId) {
        return null
      }
      const cacheKey = `user:userId:${cachedUserId}`
      return this.get<RawUser>(cacheKey)
    }
  }

  async removeUser(user: OptionalExcept<RawUser, 'userId' | 'userName'>): Promise<void> {
    await this.del(`user:userId:${user.userId}`)
    await this.del(`user:userName:${user.userName}:userId`)
  }
}

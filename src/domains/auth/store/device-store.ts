import type { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Device, DeviceCache } from '@zvonimirsun/iszy-common'
import ms, { StringValue } from 'ms'

@Injectable()
export class DeviceStore {
  private readonly refreshExpireTime: StringValue
  private readonly refreshExpireMs: number

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.refreshExpireTime = this.configService.get<StringValue>('auth.jwt.refreshExpire')
    this.refreshExpireMs = ms(this.refreshExpireTime)
  }

  async addDevice(userId: number, deviceCache: DeviceCache): Promise<void> {
    const cachedDevice = await this.cacheManager.get<DeviceCache>(`device:${deviceCache.id}`)
    if (cachedDevice) {
      deviceCache.createdAt = cachedDevice.createdAt || deviceCache.createdAt
    }
    await this.cacheManager.set<DeviceCache>(`device:${deviceCache.id}`, deviceCache, this.refreshExpireMs)
    const oldDeviceIds = (await this.cacheManager.get<string[]>(`device:userId:${userId}`)) || []
    const deviceIds = [deviceCache.id]
    for (const deviceId of oldDeviceIds) {
      if (deviceId === deviceCache.id) {
        continue
      }
      if (await this.cacheManager.get<DeviceCache>(`device:${deviceId}`)) {
        deviceIds.push(deviceId)
      }
    }
    await this.cacheManager.set(`device:userId:${userId}`, deviceIds, this.refreshExpireMs)
  }

  async getDevice(deviceId: string): Promise<DeviceCache | null> {
    return this.cacheManager.get<DeviceCache>(`device:${deviceId}`)
  }

  async removeDevice(userId: number, { deviceId, other, all }: {
    deviceId?: string
    other?: boolean
    all?: boolean
  } = {}): Promise<void> {
    const devices = (await this.cacheManager.get<string[]>(`device:userId:${userId}`)) || []
    // 登出所有设备
    if (all) {
      for (const device of devices) {
        await this.cacheManager.del(`device:${device}`)
      }
      await this.cacheManager.del(`device:userId:${userId}`)
    }
    // 登出其他设备
    else if (other) {
      for (const device of devices) {
        if (device !== deviceId) {
          await this.cacheManager.del(`device:${device}`)
        }
      }
      await this.cacheManager.set(`device:userId:${userId}`, [deviceId], this.refreshExpireMs)
    }
    // 登出当前设备
    else if (deviceId) {
      await this.cacheManager.del(`device:${deviceId}`)
      const newDevices: string[] = []
      for (const device of devices) {
        if (device === deviceId) {
          continue
        }
        if (await this.cacheManager.get<DeviceCache>(`device:${device}`)) {
          newDevices.push(device)
        }
      }
      if (newDevices.length) {
        await this.cacheManager.set(`device:userId:${userId}`, newDevices, this.refreshExpireMs)
      }
      else {
        await this.cacheManager.del(`device:userId:${userId}`)
      }
    }
  }

  async getDevices(userId: number): Promise<Device[]> {
    const deviceIds = (await this.cacheManager.get<string[]>(`device:userId:${userId}`)) || []
    const devices: Device[] = []
    for (const deviceId of deviceIds) {
      const deviceCache = await this.cacheManager.get<DeviceCache>(`device:${deviceId}`)
      if (deviceCache) {
        const { refreshToken, ...device } = deviceCache
        devices.push(device)
      }
    }
    return devices
  }
}

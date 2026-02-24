import type { AuthRequest } from '~types/AuthRequest'
import { Device } from '@zvonimirsun/iszy-common'
import { UAParser } from 'ua-parser-js'

export function generateDevice(req: AuthRequest): Device {
  const ua = req.header('user-agent')
  // 获取设备名称，如 Chrome 103 on Windows 11
  const data = UAParser(ua)
  return {
    name: `${data.browser.name} ${data.browser.version.split('.')[0]} on ${data.os.name} ${data.os.version}`,
    ip: req.ip,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

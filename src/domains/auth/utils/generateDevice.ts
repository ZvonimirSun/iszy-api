import type { AuthRequest } from '~types/AuthRequest'
import { Device } from '@zvonimirsun/iszy-common'
import { UAParser } from 'ua-parser-js'

export function generateDevice(req: AuthRequest): Device {
  const ua = req.header('user-agent')
  // 获取设备名称，如 Chrome 103 on Windows 11
  const data = UAParser(ua)
  return {
    name: `${data.os.name} · ${data.browser.name}`,
    ip: req.ip,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

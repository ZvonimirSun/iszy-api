import type { AuthRequest } from '~shared'
import { Device } from '@zvonimirsun/iszy-common'
import ip from 'ip'
import { UAParser } from 'ua-parser-js'

export function generateDevice(req: AuthRequest): Device {
  const ua = req.header('user-agent')
  // 获取设备名称，如 Chrome 103 on Windows 11
  const data = UAParser(ua)
  const dataType: {
    [key in UAParser.IDevice['type']]?: string
  } = {
    desktop: 'PC',
    mobile: '手机',
    tablet: '平板',
    console: '主机',
    smarttv: '智能电视',
    wearable: '手表',
    xr: 'VR',
    embedded: '嵌入式设备',
  }
  return {
    name: dataType[data.device.type || 'desktop'] || '未知设备',
    ip: maskIp(req.ip),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function maskIp(address: string) {
  if (ip.isV4Format(address)) {
    if (ip.isV4Format(address)) {
      // IPv4 /24
      const network = ip.cidrSubnet(`${address}/24`).networkAddress
      return `${network}/24`
    }
    else if (ip.isV6Format(address)) {
      // IPv6 /64
      const network = ip.cidrSubnet(`${address}/64`).networkAddress
      return `${network}/64`
    }
    else {
      throw new Error('Invalid IP address')
    }
  }
}

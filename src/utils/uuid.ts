import { v4 } from 'uuid'
import { base62Encode } from './base62'

export function getUUID() {
  return v4()
}

export function encodeUUID(uuid?: string) {
  uuid = uuid || getUUID()
  const hex = uuid.replace(/-/g, '') // 移除连字符
  const high = BigInt(`0x${hex.substring(0, 16)}`) // 高位64位
  const low = BigInt(`0x${hex.substring(16, 32)}`) // 低位64位
  const hash = high ^ low // 异或运算
  return base62Encode(hash).substring(0, 6)
}

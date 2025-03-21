// Base62字符集（0-9, A-Z, a-z）
const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

// 将64位BigInt转换为Base62字符串
export function base62Encode(num: bigint) {
  let result = ''
  do {
    result = BASE62.charAt(Number(num % 62n)) + result
    num = num / 62n
  } while (num > 0n)
  return result
}

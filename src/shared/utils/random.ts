import { customAlphabet } from 'nanoid'

export function random(length = 8) {
  const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
  return nanoid(length)
}

export function uuid() {
  return crypto.randomUUID()
}

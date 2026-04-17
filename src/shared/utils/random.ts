import { customAlphabet } from 'nanoid'
import { v7 } from 'uuid'

export function random(length = 8) {
  const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
  return nanoid(length)
}

export function uuid() {
  return crypto.randomUUID()
}

export function uuidV7() {
  return v7()
}

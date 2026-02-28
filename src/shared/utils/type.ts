export function isObject(input: unknown) {
  return typeof input === 'object' && !Array.isArray(input)
}

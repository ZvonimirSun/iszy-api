import * as process from 'node:process'
import destr from 'destr'
import { snakeCase } from 'scule'
import { EnvOptions, isObject } from '~shared'

function getEnv(key: string, opts: EnvOptions, env = process.env) {
  const { prefix = '', altPrefix = '' } = opts
  const envKey = snakeCase(key).toUpperCase()
  return destr(
    env[prefix + envKey] ?? env[altPrefix + envKey],
  )
}

export function applyEnv(
  obj: Record<string, any>,
  opts: EnvOptions,
  parentKey = '',
) {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key
    const envValue = getEnv(subKey, opts)
    if (isObject(obj[key])) {
      // Same as before
      if (isObject(envValue)) {
        obj[key] = { ...(obj[key] as any), ...(envValue as any) }
        applyEnv(obj[key], opts, subKey)
      }
      else if (envValue === undefined) {
        // If envValue is undefined
        // Then proceed to nested properties
        applyEnv(obj[key], opts, subKey)
      }
      else {
        // If envValue is a primitive other than undefined
        // Then set objValue and ignore the nested properties
        obj[key] = envValue ?? obj[key]
      }
    }
    else {
      obj[key] = envValue ?? obj[key]
    }
    // Experimental env expansion
    if (opts.envExpansion && typeof obj[key] === 'string') {
      obj[key] = _expandFromEnv(obj[key])
    }
  }
  return obj
}

const envExpandRx = /\{\{([^{}]*)\}\}/g
function _expandFromEnv(value: string, env: Record<string, any> = process.env) {
  return value.replace(envExpandRx, (match, key) => {
    return env[key] || match
  })
}

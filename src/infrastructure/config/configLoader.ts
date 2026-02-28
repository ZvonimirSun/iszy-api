import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as process from 'node:process'
import * as yaml from 'js-yaml'
import { merge } from 'lodash'
import { applyEnv } from './utils'

/**
 * Configuration loader with priority chain:
 * 1. process.env (highest priority)
 * 2. .env.local
 * 3. .env
 * 4. config/config.yaml (optional user config)
 * 5. default.yaml (built-in defaults, lowest priority)
 */
export default () => {
  const rootPath = process.cwd()

  // Load default configuration
  const defaultConfigPath = join(__dirname, 'config/default.yaml')
  const defaultConfig = yaml.load(readFileSync(defaultConfigPath, 'utf-8')) as Record<string, any>

  // Load user configuration if exists
  const userConfigPath = join(rootPath, 'config/config.yaml')
  let userConfig = {}
  if (existsSync(userConfigPath)) {
    userConfig = yaml.load(readFileSync(userConfigPath, 'utf-8')) as Record<string, any> || {}
  }

  // Merge configurations: default <- user
  let config = merge({}, defaultConfig, userConfig)

  // Apply environment variables recursively
  config = applyEnv(config, {
    envExpansion: true, // Enable env variable expansion
  })

  // Debug output in development mode
  if (config.development) {
    console.log('[Config] Loaded configuration:', config)
  }

  return config
}

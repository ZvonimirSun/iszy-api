import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as process from 'node:process'
import { defu } from 'defu'
import * as yaml from 'js-yaml'
import { AppConfiguration, Logger } from '~shared'
import { DefaultConfig } from './default'
import { applyEnv } from './utils'

const logger = new Logger('ConfigLoader')

/**
 * Configuration loader with priority chain:
 * 1. process.env (highest priority)
 * 2. .env.local
 * 3. .env
 * 4. config/config.yaml (optional user config)
 * 5. default.yaml (built-in defaults, lowest priority)
 */
export default (): AppConfiguration => {
  const rootPath = process.cwd()

  // Load user configuration if exists
  const userConfigPath = join(rootPath, 'config/config.yaml')
  let userConfig: Partial<AppConfiguration> = {}
  if (existsSync(userConfigPath)) {
    userConfig = yaml.load(readFileSync(userConfigPath, 'utf-8')) || {}
  }

  // Default configurations: user <- default
  let config: AppConfiguration = defu({}, userConfig, DefaultConfig)

  // Apply environment variables recursively
  config = applyEnv<AppConfiguration>(config, {
    prefix: 'I_', // Only consider env vars starting with I_
    envExpansion: true, // Enable env variable expansion
  })

  // Debug output in development mode
  if (config.development) {
    logger.debug('已加载配置', {
      app: {
        port: config.app.port,
        origin: config.app.origin,
        allowOrigins: config.app.allowOrigins,
      },
      database: {
        dialect: config.database.dialect,
        host: config.database.host,
        port: config.database.port,
        schema: config.database.schema,
      },
      redis: {
        host: config.redis.host,
        port: config.redis.port,
      },
      behindProxy: config.behindProxy,
      development: config.development,
    })
  }

  return config
}

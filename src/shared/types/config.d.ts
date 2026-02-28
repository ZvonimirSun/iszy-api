/**
 * Configuration type definitions
 * Used with NestJS ConfigService.get<T>(key) for type-safe configuration access
 */

import type { SequelizeModuleOptions } from '@nestjs/sequelize'

/**
 * Database configuration
 * Extends Sequelize options with NestJS SequelizeModule specific options
 *
 * Usage: this.configService.get<DatabaseConfig>('database')
 */
export type DatabaseConfig = SequelizeModuleOptions

/**
 * Redis configuration
 *
 * Usage: this.configService.get<RedisConfig>('redis')
 */
export interface RedisConfig {
  host: string
  port: number
  password?: string
}

/**
 * Application configuration interface
 *
 * Usage: this.configService.get<AppConfig>('app')
 */
export interface AppConfig {
  port: number
  origin: string
  title: string
  description: string
  allowOrigins: string | string[] | null
  bodyLimit: string
}

/**
 * JWT configuration interface
 */
export interface JwtConfig {
  secret: string
  expire: string
  refreshExpire: string
}

/**
 * OAuth provider configuration
 */
export interface OAuthProviderConfig {
  clientId: string
  clientSecret: string
  callbackUrl: string
}

/**
 * Authentication configuration interface
 *
 * Usage: this.configService.get<AuthConfig>('auth')
 */
export interface AuthConfig {
  publicRegister: boolean
  jwt: JwtConfig
  github: OAuthProviderConfig
  linuxdo: OAuthProviderConfig
}

/**
 * System configuration interface
 *
 * Usage: this.configService.get<SystemConfig>('behindProxy'), etc.
 */
export interface SystemConfig {
  behindProxy: boolean
  trustProxy?: string
  development: boolean
  systemProxy?: string
}

/**
 * Complete application configuration
 *
 * Usage: this.configService.get<AppConfiguration>() to get the entire config
 */
export interface AppConfiguration {
  database: DatabaseConfig
  redis: RedisConfig
  app: AppConfig
  auth: AuthConfig
  behindProxy: boolean
  trustProxy?: string
  development: boolean
  systemProxy?: string
}

export interface EnvOptions {
  prefix?: string
  altPrefix?: string
  envExpansion?: boolean
}

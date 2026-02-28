import type { SequelizeModuleOptions } from '@nestjs/sequelize'
import type { StringValue } from 'ms'

/**
 * Configuration type definitions
 * Used with NestJS ConfigService.get<T>(key) for type-safe configuration access
 */

/**
 * Database configuration
 * Extends Sequelize options with NestJS SequelizeModule specific options
 *
 * @example this.configService.get<DatabaseConfig>('database')
 */
export type DatabaseConfig = SequelizeModuleOptions

/**
 * Redis configuration
 *
 * @example this.configService.get<RedisConfig>('redis')
 */
export interface RedisConfig {
  host: string
  port: number
  password?: string
}

/**
 * Application configuration interface
 *
 * @example this.configService.get<AppConfig>('app')
 */
export interface AppConfig {
  port: number
  origin: string
  title: string
  description: string
  allowOrigins?: string
  bodyLimit: string
}

/**
 * JWT configuration interface
 *
 * @example this.configService.get<JwtConfig>('auth.jwt')
 */
export interface JwtConfig {
  secret: string
  expire: StringValue
  refreshExpire: StringValue
}

/**
 * OAuth provider configuration
 */
export interface OAuthProviderConfig {
  clientId: string
  clientSecret: string
}

/**
 * Authentication configuration interface
 *
 * @example this.configService.get<AuthConfig>('auth')
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
  behindProxy?: boolean
  trustProxy?: string
  development?: boolean
  systemProxy?: string
}

/**
 * Complete application configuration
 *
 * Usage: this.configService.get<AppConfiguration>() to get the entire config
 */
export interface AppConfiguration extends SystemConfig {
  database: DatabaseConfig
  redis: RedisConfig
  app: AppConfig
  auth: AuthConfig
}

export interface EnvOptions {
  prefix?: string
  altPrefix?: string
  envExpansion?: boolean
}

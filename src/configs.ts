// config/db.ts
import * as process from 'node:process'

export default () => {
  const appPort = Number.parseInt(process.env.APP_PORT || process.env.PORT || '3000')
  const appOrigin = process.env.APP_ORIGIN || `http://localhost:${appPort}`

  return {
    database: {
      type: process.env.DATABASE_TYPE || 'postgres',
      port: Number.parseInt(process.env.DATABASE_PORT || '5432'),
      host: process.env.DATABASE_HOST || '127.0.0.1',
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWD,
      database: process.env.DATABASE_DATABASE,
      schema: process.env.DATABASE_SCHEMA || 'public',
      connectionLimit: Number.parseInt(process.env.DATABASE_LIMIT || '10'),
      logging: process.env.DATABASE_LOGGING === 'true',
    },
    redis: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number.parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWD,
    },
    app: {
      origin: appOrigin,
      port: appPort,
      title: process.env.APP_TITLE || 'ISZY API',
      description: process.env.APP_DESCRIPTION || 'ISZY API description',
      allowOrigins: process.env.APP_ALLOW_ORIGINS
        ? process.env.APP_ALLOW_ORIGINS.split(',')
        : null,
      bodyLimit: process.env.APP_BODY_LIMIT || '200mb',
    },
    auth: {
      publicRegister: process.env.PUBLIC_REGISTER === 'true',
      jwt: {
        secret: process.env.JWT_SECRET || '',
        expire: process.env.JWT_EXPIRE || '1d',
        refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
      },
      github: {
        enabled: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        callbackUrl: process.env.GITHUB_CALLBACK_URL || `${appOrigin}/auth/github/callback`,
      },
      linuxdo: {
        enabled: Boolean(process.env.LINUXDO_CLIENT_ID && process.env.LINUXDO_CLIENT_SECRET),
        clientId: process.env.LINUXDO_CLIENT_ID || '',
        clientSecret: process.env.LINUXDO_CLIENT_SECRET || '',
        callbackUrl: process.env.LINUXDO_CALLBACK_URL || `${appOrigin}/auth/linuxdo/callback`,
      },
    },
    behindProxy: process.env.PROXY === 'true',
    trustProxy: process.env.TRUST_PROXY,
    development: process.env.DEVELOPMENT === 'true',
    systemProxy: process.env.http_proxy || process.env.HTTP_PROXY || process.env.https_proxy || process.env.HTTPS_PROXY || '',
  }
}

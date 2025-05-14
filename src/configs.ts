import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import * as process from 'node:process'
import * as yaml from 'js-yaml'
import { merge } from 'lodash'

export default () => {
  const rootPath = process.cwd()
  const ymlFilePath = join(rootPath, 'config/config.yaml')
  if (!existsSync(ymlFilePath)) {
    // 创建对应目录
    if (!existsSync(join(rootPath, 'config'))) {
      mkdirSync(join(rootPath, 'config'))
    }
    const ymlContent = yaml.dump({
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
        origin: process.env.APP_ORIGIN,
        port: Number.parseInt(process.env.APP_PORT || process.env.PORT || '3000'),
        title: process.env.APP_TITLE || 'ISZY API',
        description: process.env.APP_DESCRIPTION || 'ISZY API description',
        allowOrigins: process.env.APP_ALLOW_ORIGINS || '',
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
          clientId: process.env.GITHUB_CLIENT_ID || '',
          clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
          callbackUrl: process.env.GITHUB_CALLBACK_URL || '',
        },
        linuxdo: {
          clientId: process.env.LINUXDO_CLIENT_ID || '',
          clientSecret: process.env.LINUXDO_CLIENT_SECRET || '',
          callbackUrl: process.env.LINUXDO_CALLBACK_URL || '',
        },
      },
      behindProxy: process.env.PROXY === 'true',
      trustProxy: process.env.TRUST_PROXY || '',
      development: process.env.DEVELOPMENT === 'true',
      systemProxy: process.env.http_proxy || process.env.HTTP_PROXY || process.env.https_proxy || process.env.HTTPS_PROXY || '',
    })
    writeFileSync(ymlFilePath, ymlContent, 'utf-8')
  }

  const config = yaml.load(readFileSync(ymlFilePath, 'utf-8')) as any || {}

  const appPort = config.app?.port || 3000
  const appOrigin = config.app?.origin || `http://localhost:${appPort}`

  return merge(
    // 默认配置
    {
      database: {
        type: 'postgres',
        port: 5432,
        host: '127.0.0.1',
        user: '',
        password: '',
        database: '',
        schema: 'public',
        connectionLimit: 10,
        logging: false,
      },
      redis: {
        host: '127.0.0.1',
        port: 6379,
        password: '',
      },
      app: {
        origin: appOrigin,
        port: appPort,
        title: 'ISZY API',
        description: 'ISZY API description',
        allowOrigins: null,
        bodyLimit: '200mb',
      },
      auth: {
        publicRegister: false,
        jwt: {
          secret: '',
          expire: '1d',
          refreshExpire: '7d',
        },
        github: {
          clientId: '',
          clientSecret: '',
          callbackUrl: '',
        },
        linuxdo: {
          clientId: '',
          clientSecret: '',
          callbackUrl: '',
        },
      },
      behindProxy: false,
      trustProxy: undefined,
      development: false,
      systemProxy: '',
    },
    // 用户配置
    config,
    // 配置后处理
    {
      auth: {
        app: {
          allowOrigins: config.app?.allowOrigins ? config.app.allowOrigins.split(',') : null,
        },
        github: {
          callbackUrl: config.github?.callbackUrl || `${appOrigin}/auth/github/callback`,
        },
        linuxdo: {
          callbackUrl: config.linuxdo?.callbackUrl || `${appOrigin}/auth/linuxdo/callback`,
        },
      },
    },
  )
}

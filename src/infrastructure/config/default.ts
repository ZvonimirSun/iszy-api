import { AppConfiguration } from '~shared'

export const DefaultConfig: AppConfiguration = {
  database: {
    dialect: 'postgres',
    host: 'localhost',
    port: 5432,
    schema: 'public',
    models: [],
    pool: {
      max: 10,
      min: 1, // 连接池中最小连接数量
      acquire: 30000,
      idle: 10000, // 如果一个线程 10 秒钟内没有被使用过的话，那么就释放线程
    },
    timezone: '+08:00',

    autoLoadModels: true,
    logging: false,
  },
  redis: {
    host: 'localhost',
    port: 6379,
    password: undefined,
  },
  app: {
    port: 3000,
    origin: 'http://localhost',
    title: '',
    description: '',
    allowOrigins: undefined,
    bodyLimit: '20mb',
  },
  auth: {
    publicRegister: false,
    jwt: {
      secret: 'your_jwt_secret_key_change_this_in_production',
      expire: '1h',
      refreshExpire: '7d',
    },
    github: {
      clientId: '',
      clientSecret: '',
    },
    linuxdo: {
      clientId: '',
      clientSecret: '',
    },
  },
  behindProxy: false,
  trustProxy: undefined,
  development: false,
}

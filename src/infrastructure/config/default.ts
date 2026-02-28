import { AppConfiguration } from '~shared'

export const DefaultConfig: AppConfiguration = {
  database: {
    dialect: 'postgres',
    host: 'localhost',
    port: 5432,
    schema: 'public',
    pool: {
      max: 10,
    },
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
  systemProxy: undefined,
}

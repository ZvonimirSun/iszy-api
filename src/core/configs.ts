// config/db.ts

export default () => ({
  database: {
    type: process.env.DATABASE_TYPE || 'postgres',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    host: process.env.DATABASE_HOST || '127.0.0.1',
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWD,
    database: process.env.DATABASE_DATABASE,
    schema: process.env.DATABASE_SCHEMA || 'public',
    connectionLimit: parseInt(process.env.DATABASE_LIMIT || '10'),
    logging: process.env.DATABASE_LOGGING === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWD,
  },
  session: {
    secret: process.env.SESSION_SECRET,
    maxAge:
      process.env.SESSION_MAXAGE != null
        ? parseInt(process.env.SESSION_MAXAGE)
        : undefined,
  },
  app: {
    port: parseInt(process.env.APP_PORT || process.env.PORT || '3000'),
    title: process.env.APP_TITLE || 'ISZY API',
    description: process.env.APP_DESCRIPTION || 'ISZY API description',
    allowOrigins: process.env.APP_ALLOW_ORIGINS
      ? process.env.APP_ALLOW_ORIGINS.split(',')
      : null,
  },
  behindProxy: process.env.PROXY === 'true',
  trustProxy: process.env.TRUST_PROXY ? process.env.TRUST_PROXY.split(',') : [],
  development: process.env.DEVELOPMENT === 'true',
});

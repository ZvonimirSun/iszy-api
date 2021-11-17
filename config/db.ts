// config/db.ts

export default () => ({
  database: {
    type: process.env.DATABASE_TYPE || 'postgres',
    port: parseInt(process.env.DATABASE_PORT || '35432'),
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWD,
    database: process.env.DATABASE_DATABASE,
    schema: process.env.DATABASE_SCHEMA || 'public',
    connectionLimit: parseInt(process.env.DATABASE_LIMIT || '10'),
    logging: process.env.DATABASE_LOGGING === 'true',
  },
});

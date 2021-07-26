// config/db.ts

export default {
  mysql: {
    port: process.env.MYSQL_PORT,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: 10,
  },
};

export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET,
    expireTime: process.env.JWT_EXPIRE_TIME || '8h',
  },
});

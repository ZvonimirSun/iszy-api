export default () => ({
  tron: {
    pk: process.env.TRON_PK || '',
    apiKey: process.env.TRON_API_KEY || '',
  },
});

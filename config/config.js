// config/config.js
require('dotenv').config();

const sslOptions = (setting) => (setting === 'true'
  ? {
    prependSearchPath: true,
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  }
  : { prependSearchPath: true });

const sslSetting = process.env.DB_SSL || (process.env.NODE_ENV === 'production' ? 'true' : 'false');
const base = {
  url: process.env.DATABASE_URL,
  dialect: 'postgres',
  logging: false,
  searchPath: 'public',
};

module.exports = {
  development: {
    ...base,
    dialectOptions: sslOptions(sslSetting),
  },
  test: {
    ...base,
    dialectOptions: sslOptions(sslSetting),
  },
  production: {
    ...base,
    dialectOptions: sslOptions(sslSetting),
  },
};

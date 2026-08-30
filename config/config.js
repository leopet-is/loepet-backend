// config/config.js
require('dotenv').config();

// Forzar SSL en produccion (Supabase/Render) o cuando DB_SSL=true.
// Si DB_SSL se define explicitamente (true/false) esa decision manda.
const sslRequired = process.env.DB_SSL
  ? process.env.DB_SSL === 'true'
  : process.env.NODE_ENV === 'production';

const base = {
  url: process.env.DATABASE_URL,
  dialect: 'postgres',
  logging: false,
  dialectOptions: sslRequired
    ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    }
    : {},
};

module.exports = {
  development: { ...base },
  test: { ...base },
  production: { ...base },
};

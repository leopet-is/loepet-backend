/* eslint-disable import/no-dynamic-require */
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
require('dotenv').config();

const basename = path.basename(__filename);
const db = {};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL es obligatoria para conectar con PostgreSQL.');
}

// Forzar SSL en produccion (Supabase/Render) o cuando DB_SSL=true.
// Si DB_SSL se define explicitamente (true/false) esa decision manda
// (p. ej. local: NODE_ENV=production + DB_SSL=false para Postgres local sin TLS).
const sslSetting = process.env.DB_SSL;
const sslRequired = sslSetting
  ? sslSetting === 'true'
  : process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false, // Cámbialo a console.log si quieres ver los queries en desarrollo
  searchPath: 'public',
  dialectOptions: sslRequired
    ? {
      ssl: {
        require: true,
        // Supabase requiere SSL con certificados autofirmados.
        rejectUnauthorized: false,
      },
      prependSearchPath: true,
    }
    : { prependSearchPath: true },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Cargar modelos dinámicamente
fs.readdirSync(__dirname)
  .filter((file) => (
    file.indexOf('.') !== 0
    && file !== basename
    && file.slice(-3) === '.js'
    && file.indexOf('.test.js') === -1
  ))
  .forEach((file) => {
    /* eslint-disable-next-line global-require */
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Configurar asociaciones entre modelos
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;

db.connect = async () => {
  await sequelize.authenticate();
  console.log('Connection has been established successfully.');
};

db.disconnect = () => {
  sequelize.close();
};

module.exports = db;

/* eslint-disable import/no-dynamic-require */
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
require('dotenv').config();

const basename = path.basename(__filename);
const db = {};

// Forzar SSL en produccion (Supabase/Render) o cuando DB_SSL=true.
// Si DB_SSL se define explicitamente (true/false) esa decision manda
// (p. ej. local: NODE_ENV=production + DB_SSL=false para Postgres local sin TLS).
const sslRequired = process.env.DB_SSL
  ? process.env.DB_SSL === 'true'
  : process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false, // Cámbialo a console.log si quieres ver los queries en desarrollo
  dialectOptions: sslRequired
    ? {
      ssl: {
        require: true,
        // Supabase requiere SSL con certificados autofirmados.
        rejectUnauthorized: false,
      },
    }
    : {},
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
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (err) {
    console.error('Unable to connect to the database:', err);
  }
};

db.disconnect = () => {
  sequelize.close();
};

module.exports = db;

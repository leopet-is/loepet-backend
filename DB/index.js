/* eslint-disable import/no-dynamic-require */
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
require('dotenv').config();

const basename = path.basename(__filename);
const db = {};

// Guard de seguridad (TEST).
//
// Los tests E2E crean datos (usuarios, fundaciones, manadas, comisiones...) y
// NO los borran (por restricciones de FK). Si corren contra la BD remota de
// Supabase, la contaminan. Este guard aborta SIEMPRE que el codigo se ejecute
// bajo un runner de tests (jest) y la BD no sea local.
if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
  const testUrl = process.env.DATABASE_URL || '';
  const esLocal = /localhost|127\.0\.0\.1/.test(testUrl);
  if (!esLocal) {
    throw new Error(
      '[SEGURIDAD TEST] Los tests deben ejecutarse contra una BD local. '
      + `DATABASE_URL=${testUrl} apunta a una BD remota. `
      + 'Configura: DATABASE_URL=postgresql://leopet:leopet@localhost:5432/leopet_dev y DB_SSL=false.',
    );
  }
}

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

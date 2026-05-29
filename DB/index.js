/* eslint-disable import/no-dynamic-require */
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
require('dotenv').config();

const basename = path.basename(__filename);
const db = {};

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || process.env.DB_NAME || 'test_db',
  process.env.MYSQL_USER || process.env.DB_USER || 'root',
  process.env.MYSQL_ROOT_PASSWORD || process.env.DB_PASSWORD || 'root',
  {
    host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  },
);

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
    await sequelize.sync();
  } catch (err) {
    console.error('Unable to connect to the database:', err);
  }
};

db.disconnect = () => {
  sequelize.close();
};

module.exports = db;

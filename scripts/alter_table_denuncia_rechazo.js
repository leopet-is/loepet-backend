require('dotenv').config();
const db = require('../DB/index');

const alterTable = async () => {
  try {
    console.log('Conectando a la base de datos...');
    await db.sequelize.authenticate();
    console.log('Conexión establecida.');

    // 1. Modificar ENUM de estado
    console.log('Modificando columna estado...');
    await db.sequelize.query(`
      ALTER TABLE denuncia
      MODIFY COLUMN estado ENUM('pendiente', 'notificada', 'resuelta', 'rechazada') NOT NULL DEFAULT 'pendiente';
    `);
    console.log('Columna estado modificada.');

    // 2. Agregar columna motivo_rechazo
    console.log('Agregando columna motivo_rechazo...');
    try {
      await db.sequelize.query(`
        ALTER TABLE denuncia
        ADD COLUMN motivo_rechazo TEXT NULL;
      `);
      console.log('Columna motivo_rechazo agregada.');
    } catch (error) {
      if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
        console.log('La columna motivo_rechazo ya existe.');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.sequelize.close();
  }
};

alterTable();

require('dotenv').config();
const db = require('../DB/index');

const alterTable = async () => {
  try {
    console.log('Conectando a la base de datos...');
    await db.sequelize.authenticate();
    console.log('Conexión establecida.');

    const query = `
      ALTER TABLE denuncia
      ADD COLUMN archivos JSON NULL;
    `;

    console.log('Ejecutando alter table...');
    try {
      await db.sequelize.query(query);
      console.log('Columna archivos agregada.');
    } catch (error) {
      if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
        console.log('La columna archivos ya existe.');
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

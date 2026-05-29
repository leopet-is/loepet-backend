require('dotenv').config();
const db = require('../DB/index');

const alterTable = async () => {
  try {
    console.log('Conectando a la base de datos...');
    await db.sequelize.authenticate();
    console.log('Conexión establecida.');

    const query1 = `
      ALTER TABLE notificacion
      ADD COLUMN mensaje TEXT NULL;
    `;
    const query2 = `
      ALTER TABLE notificacion
      ADD COLUMN es_admin_mensaje BOOLEAN DEFAULT FALSE;
    `;

    console.log('Ejecutando alter table...');
    try {
      await db.sequelize.query(query1);
      console.log('Columna mensaje agregada.');
    } catch (e) {
      console.log('Columna mensaje ya existe o error:', e.message);
    }

    try {
      await db.sequelize.query(query2);
      console.log('Columna es_admin_mensaje agregada.');
    } catch (e) {
      console.log('Columna es_admin_mensaje ya existe o error:', e.message);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error alterando la tabla:', error);
    process.exit(1);
  }
};

alterTable();

/**
 * Script para inicializar la base de datos de pruebas
 * Ejecutar antes de correr los tests
 */

const db = require('../DB/index');

async function initTestDatabase() {
  try {
    console.log('Conectando a la base de datos...');
    await db.connect();

    console.log('Sincronizando modelos con la base de datos...');
    await db.sequelize.sync({ alter: true });

    console.log('✅ Base de datos inicializada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message);
    process.exit(1);
  }
}

initTestDatabase();

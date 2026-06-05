const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../DB/index');

const DEFAULT_PASSWORD = 'Leopet2025!';

async function seedDatabase() {
  try {
    await db.connect();
    const userCount = await db.Usuario.count();

    if (userCount > 0) {
      console.log(`Ya existen ${userCount} usuarios. Saltando seed.`);
      await db.sequelize.close();
      return;
    }

    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    const sqlPath = path.join(__dirname, 'integradora.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    const insertLines = sqlContent
      .split('\n')
      .filter(l => l.trim().toUpperCase().startsWith('INSERT INTO'))
      .join('\n');

    const statements = insertLines
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        await db.sequelize.query(stmt + ';');
      } catch (err) {
        console.error(`Error en INSERT (se omite): ${err.message.slice(0, 100)}`);
      }
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    await db.Usuario.update({ password: hashedPassword }, { where: {} });

    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('--- DATOS POBLADOS ---');
    console.log(`Contraseña para todos: ${DEFAULT_PASSWORD}`);
    console.log('');
    console.log('Donador:    donador@gmail.com');
    console.log('Admin:      admin@gmail.com');
    console.log('Fundación:  colitafeliz@gmail.com');
    console.log('Fundación:  refugiohuellitas@gmail.com');
    console.log('Fundación:  leopet@gmail.com');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await db.sequelize.close();
  }
}

seedDatabase();

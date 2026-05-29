const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../DB/index');

async function setupE2EData() {
  try {
    // Sync all models and force recreate tables
    // Use console.error for logs so they don't pollute stdout which is parsed as JSON
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.sequelize.sync({ force: true });
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.error('Database synced and tables recreated.');

    // Create a test foundation user
    const foundationUser = await db.Usuario.create({
      nombres: 'Fundacion E2E',
      apellidos: 'Test',
      email: 'foundation-e2e@leopet.com',
      password: await bcrypt.hash('Password123!', 10),
      telefono: '123456789',
      direccion: 'Calle Falsa 123',
      role: 2, // Assuming 2 is the role ID for Foundation
      habilitado: true,
    });

    // Create a test foundation
    const foundation = await db.Fundacion.create({
      nombre: 'E2E Test Foundation',
      descripcion: 'Una fundación de prueba para E2E',
      mision: 'Rescatar animales para pruebas E2E',
      vision: 'Un mundo con pruebas E2E',
      telefono: '987654321',
      direccion: 'Avenida Siempre Viva 742',
      red_social: 'facebook.com/e2etest',
      web: 'e2etest.com',
      imagen: 'default.jpg',
      usuario_id: foundationUser.id,
      habilitado: true,
    });

    // CRITICAL: Link foundation user to foundation in AdminFund table to avoid login 500 error
    await db.AdminFund.create({
      id: foundationUser.id,
      fundacion_id: foundation.id,
    });

    // Create a test donor user
    const donorUser = await db.Usuario.create({
      nombres: 'Donador E2E',
      apellidos: 'Test',
      email: 'donador-e2e@leopet.com',
      password: await bcrypt.hash('Password123!', 10),
      telefono: '1122334455',
      direccion: 'Calle Falsa 456',
      role: 3, // Assuming 3 is the role ID for Donor
      habilitado: true,
    });

    // Create a test animal for the foundation
    const animal = await db.Animal.create({
      nombre: 'Firulais E2E',
      especie: 'Perro',
      raza: 'Mestizo',
      edad: 3,
      sexo: true,
      peso: 12,
      descripcion: 'Un perro amigable y juguetón para pruebas E2E.',
      esterilizacion: true,
      vacunacion: true,
      desparasitacion: true,
      enfermedades: 'Ninguna',
      fundacion_id: foundation.id,
      imagen: 'firulais.jpg',
      habilitado: true,
      visible: true, // IMPORTANT: Must be visible to be listed
    });

    // Create a test commission for the foundation (for teammate's test)
    await db.Comision.create({
      fundacion_id: foundation.id,
      total_comision: 15.00,
      total_pago: 85.00,
      visible: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Return session data for the donor
    // Only this should go to stdout
    console.log(JSON.stringify({
      message: 'E2E data setup complete',
      donorEmail: donorUser.email,
      donorPassword: 'Password123!',
      donorUserId: donorUser.id,
      foundationId: foundation.id,
      animalId: animal.id,
    }));
  } catch (error) {
    console.error('Error setting up E2E data:', error);
    process.exit(1); // Exit with error code
  } finally {
    await db.sequelize.close();
  }
}

if (require.main === module) {
  setupE2EData();
}

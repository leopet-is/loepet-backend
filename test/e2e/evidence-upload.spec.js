process.env.USE_LOCAL_STORAGE = 'true'; // Force Local Storage for this test

const request = require('supertest');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const app = require('../../app');
const db = require('../../DB/index');

describe('E2E: Evidence Upload Flow', () => {
  let foundationToken;
  let donacionId;
  let uploadedImageUrl;

  // Datos de prueba
  const FOUNDATION_EMAIL = 'fundacion-evidence@test.com';
  const PASSWORD = 'Password123!';

  beforeAll(async () => {
    // 0. Crear archivo dummy para upload (Crucial para CI)
    const fixturesDir = path.join(__dirname, '../fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    const dummyFilePath = path.join(fixturesDir, 'test-image.jpg');
    if (!fs.existsSync(dummyFilePath)) {
      fs.writeFileSync(dummyFilePath, 'fake image content');
    }

    // 1. Limpiar BD
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.sequelize.sync({ force: true });
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // 2. Crear Fundación
    const foundationUser = await db.Usuario.create({
      nombres: 'Fundacion Evidence',
      apellidos: 'Test',
      email: FOUNDATION_EMAIL,
      password: await bcrypt.hash(PASSWORD, 10),
      telefono: '0999999999',
      direccion: 'Test Address',
      role: 2,
      habilitado: true,
    });

    const foundationProfile = await db.Fundacion.create({
      nombre: 'Fundación Evidence',
      descripcion: 'Prueba de evidencia',
      telefono: '0999999999',
      direccion: 'Test Address',
      email: FOUNDATION_EMAIL,
      logo: 'default.jpg',
      usuario_id: foundationUser.id,
    });

    // Crear AdminFund
    await db.AdminFund.create({
      id: foundationUser.id,
      fundacion_id: foundationProfile.id,
    });

    // 3. Crear Animal y Donador (Requeridos para la donación)
    const animal = await db.Animal.create({
      nombre: 'Animal Evidence',
      especie: 'Gato',
      fundacion_id: foundationProfile.id,
      visible: true,
    });

    const donorUser = await db.Usuario.create({
      nombres: 'Donor Evidence',
      apellidos: 'Test',
      email: 'donor-evidence@test.com',
      password: 'pass',
      role: 3,
      habilitado: true,
    });

    // 4. Crear Donación
    const donacion = await db.Donacion.create({
      donador_id: donorUser.id,
      animal_id: animal.id,
      monto: 50,
      aprobado: true,
      pagado: true,
    });
    donacionId = donacion.id;

    // 5. Login Fundación
    const res = await request(app)
      .post('/auth/login')
      .send({ email: FOUNDATION_EMAIL, password: PASSWORD });
    foundationToken = res.body.result.token;
  });

  afterAll(async () => {
    await db.sequelize.close();

    // Limpiar archivo dummy de fixtures
    const fixturesDir = path.join(__dirname, '../fixtures');
    const dummyFilePath = path.join(fixturesDir, 'test-image.jpg');
    try {
      if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);
    } catch (e) {
      console.error('Error cleaning up fixture:', e);
    }

    // Limpiar archivo dummy creado si es necesario
    try {
      if (uploadedImageUrl) {
        // Extraer nombre del archivo de la URL si queremos borrarlo físicamente
        // http://localhost:8181/uploads/xyz.jpg -> backend/uploads/xyz.jpg
        const filename = uploadedImageUrl.split('/').pop();
        const filePath = path.join(__dirname, '../../uploads', filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.error('Error cleaning up file:', e);
    }
  });

  it('1. Should upload an image file to LocalStorage', async () => {
    const filePath = path.join(__dirname, '../fixtures/test-image.jpg');

    const res = await request(app)
      .post('/otros/uploadFile')
      .set('Authorization', `Bearer ${foundationToken}`)
      .attach('file', filePath);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Imagen subida exitosamente');
    expect(res.body.fotos).toHaveLength(1);

    [uploadedImageUrl] = res.body.fotos;
    expect(uploadedImageUrl).toMatch(/^http:\/\/localhost/);
  });

  it('2. Should create evidence record with the uploaded image', async () => {
    expect(donacionId).toBeDefined();
    expect(uploadedImageUrl).toBeDefined();

    const payload = {
      donacion: donacionId,
      descripcion: 'Evidencia de prueba E2E',
      galeria: {
        fotos: [uploadedImageUrl],
      },
    };

    const res = await request(app)
      .post('/evidencia')
      .set('Authorization', `Bearer ${foundationToken}`)
      .send(payload);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toBe('Historia creado exitosamente.');
    expect(res.body.result.donacion_id).toBe(donacionId);

    // Verificar que se guardó el JSON de galería
    expect(res.body.result.galeria).toEqual(payload.galeria);
  });
});

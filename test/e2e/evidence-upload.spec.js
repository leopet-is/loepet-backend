process.env.STORAGE_PROVIDER = 'local'; // Force Local Storage for this test

const request = require('supertest');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const app = require('../../app');
const db = require('../../DB/index');

describe('E2E: Actualizacion Upload Flow', () => {
  let foundationToken;
  let animalId;
  let foundationProfileId;
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
    await db.sequelize.sync({ force: true });

    // 2. Crear Fundación
    const foundationUser = await db.Usuario.create({
      cedula: '1111111111',
      nombres: 'Fundacion Evidence',
      apellidos: 'Test',
      email: FOUNDATION_EMAIL,
      password: await bcrypt.hash(PASSWORD, 10),
      telefono: '0999999999',
      direccion: 'Test Address',
      role: 2,
    });

    const foundationProfile = await db.Fundacion.create({
      ruc: '0998885552001',
      nombre: 'Fundación Evidence',
      descripcion: 'Prueba de evidencia',
      telefono: '0999999999',
      direccion: 'Test Address',
      email: FOUNDATION_EMAIL,
      logo: 'default.jpg',
      usuario_id: foundationUser.id,
    });
    foundationProfileId = foundationProfile.id;

    // Crear AdminFund
    await db.AdminFund.create({
      id: foundationUser.id,
      fundacion_id: foundationProfile.id,
    });

    // 3. Crear Animal y Donador
    const animal = await db.Animal.create({
      nombre: 'Animal Evidence',
      especie: 'GATO',
      sexo: 'HEMBRA',
      fundacion_id: foundationProfile.id,
      visible: true,
    });
    animalId = animal.id;

    const donorUser = await db.Usuario.create({
      cedula: '2222222222',
      nombres: 'Donor Evidence',
      apellidos: 'Test',
      email: 'donor-evidence@test.com',
      password: 'pass',
      telefono: '0998888888',
      role: 3,
    });

    // 4. Donación del animal (para el historial del animal y del donador)
    await db.Donacion.create({
      donador_id: donorUser.id,
      animal_id: animal.id,
      monto: 50,
      aprobado: true,
      pagado: true,
    });

    // 5. Login Fundación
    const res = await request(app)
      .post('/auth/login')
      .send({ email: FOUNDATION_EMAIL, password: PASSWORD });
    foundationToken = res.body.result.token;
  }, 120000);

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

  it('2. Should create actualizacion record with the uploaded image', async () => {
    expect(animalId).toBeDefined();
    expect(uploadedImageUrl).toBeDefined();

    const payload = {
      animal_id: animalId,
      fundacion_id: foundationProfileId,
      descripcion: 'Evidencia de prueba E2E',
      estado_salud: 'BUENO',
      imagen: uploadedImageUrl,
      galeria: {
        fotos: [uploadedImageUrl],
      },
    };

    const res = await request(app)
      .post('/actualizacion')
      .set('Authorization', `Bearer ${foundationToken}`)
      .send(payload);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toBe('Actualizacion registrada exitosamente.');
    expect(res.body.result.animal_id).toBe(animalId);
    expect(res.body.result.fundacion_id).toBe(foundationProfileId);

    // Verificar que se guardó el JSON de galería
    expect(res.body.result.galeria).toEqual(payload.galeria);
  });
});

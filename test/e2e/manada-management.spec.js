const request = require('supertest');
const bcrypt = require('bcrypt');

// MOCK PAYPAL: Must be defined BEFORE importing app
jest.mock('../../controllers/helpersPayPal', () => ({
  createProductManada: jest.fn(() => Promise.resolve({ id: 'mock-paypal-id' })),
}));

const app = require('../../app');
const db = require('../../DB/index');

describe('E2E: Manada Management', () => {
  let donorToken;
  let animalId;
  let fundacionId;

  // Datos de prueba constantes
  const DONOR_EMAIL = 'donor-manada@test.com';
  const DONOR_PASSWORD = 'Password123!';
  const FOUNDATION_EMAIL = 'fundacion-manada@test.com';

  beforeAll(async () => {
    // 1. Limpiar la base de datos
    await db.sequelize.sync({ force: true });

    // 2. Crear Fundación (Usuario + Perfil + AdminFund)
    const foundationUser = await db.Usuario.create({
      nombres: 'Fundacion Manada',
      apellidos: 'Test',
      email: FOUNDATION_EMAIL,
      password: await bcrypt.hash(DONOR_PASSWORD, 10),
      telefono: '0999999999',
      direccion: 'Test Address',
      role: 2, // ROL.ADMIN_FUND
      habilitado: true,
    });

    const foundationProfile = await db.Fundacion.create({
      nombre: 'Fundación Manada Test',
      descripcion: 'Fundación para pruebas de manada',
      telefono: '0999999999',
      direccion: 'Test Address',
      email: FOUNDATION_EMAIL,
      logo: 'default.jpg',
      usuario_id: foundationUser.id,
    });
    fundacionId = foundationProfile.id;

    // Crear enlace AdminFund (Crucial para evitar errores)
    await db.AdminFund.create({
      id: foundationUser.id,
      fundacion_id: fundacionId,
    });

    // 3. Crear Animal
    const animal = await db.Animal.create({
      nombre: 'Animal Manada',
      especie: 'Perro',
      raza: 'Mestizo',
      edad: 2,
      peso: 10,
      sexo: 'MACHO',
      descripcion: 'Perro para pruebas de manada',
      fundacion_id: fundacionId,
      visible: true,
      habilitado: true,
      imagen: 'default.jpg',
    });
    animalId = animal.id;

    // 4. Crear Usuario Donador
    await db.Usuario.create({
      nombres: 'Donador Manada',
      apellidos: 'Test',
      email: DONOR_EMAIL,
      password: await bcrypt.hash(DONOR_PASSWORD, 10),
      telefono: '0988888888',
      direccion: 'Donor Address',
      role: 3, // ROL.DONADOR
      habilitado: true,
    });

    // 5. Iniciar Sesión como Donador para obtener token
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: DONOR_EMAIL,
        password: DONOR_PASSWORD,
      });

    donorToken = res.body.result.token;
  });

  afterAll(async () => {
    // Cerrar conexión a la BD
    await db.sequelize.close();
  });

  let manadaId;

  it('1. Donor should create a Manada successfully', async () => {
    const res = await request(app)
      .post('/manada')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        nombre: 'Manada E2E Test',
        monto: 50,
        galeriamanada: [],
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toBe('Manada creada exitosamente');
    expect(res.body.manada).toHaveProperty('id');
    expect(res.body.manada.nombre).toBe('Manada E2E Test');

    manadaId = res.body.manada.id;
  });

  it('2. Donor should add animals to the Manada', async () => {
    expect(manadaId).toBeDefined();
    expect(animalId).toBeDefined();

    const payload = {
      animalId: [animalId],
    };

    const res = await request(app)
      .post(`/manada/${manadaId}/animals`)
      .set('Authorization', `Bearer ${donorToken}`)
      .send(payload);

    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toContain('Animales agregados exitosamente');

    // Verificar en BD que la relación existe
    const relation = await db.ManadaAnimal.findOne({
      where: {
        manada_id: manadaId,
        animal_id: animalId,
      },
    });
    expect(relation).not.toBeNull();
  });

  it('3. Manada should verify subscription status logic', async () => {
    // Verificamos que al crearla, el estado de suscripción por defecto es false (0)
    // ya que no hemos completado el flujo de pago real de PayPal.
    const manada = await db.Manada.findByPk(manadaId);
    expect(manada.statusSubscription).toBeFalsy(); // 0 o false

    // Nota: Probar la activación real requeriría mockear la respuesta de PayPal
    // o llamar al webhook, lo cual es un test más avanzado de integración con terceros.
    // Por ahora validamos que la estructura inicial es correcta.
  });
});

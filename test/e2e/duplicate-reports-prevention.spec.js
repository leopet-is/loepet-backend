/* eslint-disable camelcase */
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const db = require('../../DB/index');

describe('E2E: Duplicate Reports Prevention', () => {
  let adminToken;
  let fundacionProfile;
  let donadorUser;
  let manada;
  let animal1;
  let animal2;

  beforeAll(async () => {
    await db.connect();
    // No limpiar nada, solo usar datos únicos con timestamp
    // para evitar conflictos con otros tests o datos existentes

    // ============================================
    // Setup: Crear usuarios y datos base con timestamp único
    // ============================================

    const timestamp = Date.now();
    const adminEmail = `admin-duplicate-test-${timestamp}@leopet.com`;
    const donadorEmail = `donador-duplicate-test-${timestamp}@leopet.com`;

    // Crear y autenticar ADMIN
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Password123!', salt);
    const shortTs = timestamp.toString().slice(-7);

    const admin = await db.Usuario.create({
      cedula: `01${shortTs}0`,
      nombres: 'Admin',
      apellidos: 'Test',
      email: adminEmail,
      password: hash,
      role: 1, // ADMIN
      telefono: '0999999999',
      direccion: 'Test Address',
    });

    adminToken = jwt.sign(admin.get({ plain: true }), 'secret', { expiresIn: 28800 });

    // Crear DONADOR
    const donador = await db.Usuario.create({
      cedula: `02${shortTs}0`,
      nombres: 'Donador',
      apellidos: 'Test',
      email: donadorEmail,
      password: hash,
      role: 3, // DONADOR
      telefono: '0999999998',
      direccion: 'Test Address',
    });

    donadorUser = donador.get({ plain: true });

    // Crear FUNDACIÓN con RUC único
    fundacionProfile = await db.Fundacion.create({
      ruc: `01${shortTs}001`,
      nombre: `Fundación Duplicate Test ${timestamp}`,
      descripcion: 'Descripción de prueba',
      direccion: 'Test Address',
      telefono: '0999999999',
      aprobado: true,
      comision: 0.15,
      logo: 'https://example.com/test-logo.png',
    });

    // Crear MANADA con suscripción activa
    manada = await db.Manada.create({
      userId: donadorUser.id,
      nombre: 'Manada Test',
      status: true,
    });
    await db.SuscripcionPadrino.create({
      manadaId: manada.id,
      montoTotal: 100,
      statusSubscription: true,
    });

    // Crear ANIMALES
    animal1 = await db.Animal.create({
      nombre: 'Perrito 1',
      status: 'REQUIERE_PADRINOS',
      especie: 'PERRO',
      sexo: 'MACHO',
      raza: 'Mestizo',
      descripcion: 'Animal de prueba 1',
      imagen: 'http://example.com/image1.jpg',
      fundacion_id: fundacionProfile.id,
      visible: true,
    });

    animal2 = await db.Animal.create({
      nombre: 'Perrito 2',
      status: 'REQUIERE_PADRINOS',
      especie: 'PERRO',
      sexo: 'MACHO',
      raza: 'Mestizo',
      descripcion: 'Animal de prueba 2',
      imagen: 'http://example.com/image2.jpg',
      fundacion_id: fundacionProfile.id,
      visible: true,
    });

    // Agregar animales a la manada
    await db.ManadaAnimal.create({
      manada_id: manada.id,
      animal_id: animal1.id,
    });

    await db.ManadaAnimal.create({
      manada_id: manada.id,
      animal_id: animal2.id,
    });
  });

  afterAll(async () => {
    // Cleanup: comentado por foreign key constraints
    // En un entorno de testing real, se limpiaría toda la BD entre tests
    // await db.Usuario.destroy({
    //   where: { email: { [db.Sequelize.Op.like]: '%duplicate-test%' } },
    //   force: true
    // });
  });

  describe('First Report Generation', () => {
    it('should get available animals/manadas for report', async () => {
      const res = await request(app)
        .get(`/fundacion/padrinos/calificacion/${fundacionProfile.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 15 });

      expect(res.status).toBe(200);
      expect(res.body.result).toBeDefined();
      expect(res.body.result.length).toBeGreaterThan(0);

      // Debe mostrar los 2 animales de la manada
      expect(res.body.result.length).toBe(2);
    });

    it('should create first commission report successfully', async () => {
      // Primero obtener los animales disponibles
      const getAnimalsRes = await request(app)
        .get(`/fundacion/padrinos/calificacion/${fundacionProfile.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 15 });

      const animales = getAnimalsRes.body.result;

      // Calcular totales
      const total_pago = animales.reduce((sum, a) => sum + (a.total || 0), 0);
      const total_comision = animales.reduce((sum, a) => sum + (a.montocomision || 0), 0);

      // Crear el reporte
      const res = await request(app)
        .post('/comision')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fundacionId: fundacionProfile.id,
          total_comision,
          total_pago,
          animales,
        });

      expect(res.status).toBe(200);
      expect(res.body.mensaje).toContain('Comision Creada exitosamente');
      expect(res.body.result).toBeDefined();
      expect(res.body.result.id).toBeDefined();

      // Verificar que se creó el registro en comision
      const comision = await db.Comision.findOne({
        where: { fundacion_id: fundacionProfile.id },
      });

      expect(comision).toBeDefined();
      expect(parseFloat(comision.total_pago)).toBe(total_pago);
      expect(parseFloat(comision.total_comision)).toBe(total_comision);

      // Verificar que se crearon los registros en comision_manada
      const comisionManadas = await db.ComisionManada.findAll({
        where: { comision_id: comision.id },
      });

      expect(comisionManadas.length).toBe(2); // 2 animales
      expect(comisionManadas[0].manada_id).toBe(manada.id);
      expect(comisionManadas[0].animal_id).toBeDefined();
    });
  });

  describe('Duplicate Prevention', () => {
    it('should NOT show already reported animals/manadas', async () => {
      // Intentar obtener animales disponibles de nuevo
      const res = await request(app)
        .get(`/fundacion/padrinos/calificacion/${fundacionProfile.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 15 });

      expect(res.status).toBe(200);
      expect(res.body.result).toBeDefined();

      // No debe mostrar ningún animal (ya fueron reportados hace menos de 30 días)
      expect(res.body.result.length).toBe(0);
    });

    it('should prevent creating duplicate report without animals from frontend', async () => {
      // En el flujo real, el frontend no tendría animales para enviar
      // porque getAnimalPadrinosCalificacion devuelve lista vacía

      // Este test valida que el backend rechaza reportes sin animales
      const res = await request(app)
        .post('/comision')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fundacionId: fundacionProfile.id,
          total_comision: 0,
          total_pago: 0,
          animales: [], // Vacío porque no hay animales disponibles
        });

      // Debe rechazar por array vacío
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('al menos un animal');

      // Verificar que sigue habiendo solo 1 comisión
      const comisiones = await db.Comision.findAll({
        where: { fundacion_id: fundacionProfile.id },
      });

      expect(comisiones.length).toBe(1);
    });
  });

  describe('Time-based Re-reporting (After 30 days)', () => {
    it('should allow re-reporting after 30 days', async () => {
      // Modificar la fecha de las entradas en comision_manada
      // para simular que pasaron 30+ días
      const hace31Dias = new Date();
      hace31Dias.setDate(hace31Dias.getDate() - 31);

      // Get the comision IDs for this fundacion
      const comisiones = await db.Comision.findAll({
        where: { fundacion_id: fundacionProfile.id },
        attributes: ['id'],
      });
      const comisionIds = comisiones.map((c) => c.id);

      await db.ComisionManada.update(
        { createdAt: hace31Dias, updatedAt: hace31Dias },
        { where: { comision_id: comisionIds } },
      );

      // Ahora debería poder obtener los animales de nuevo
      const res = await request(app)
        .get(`/fundacion/padrinos/calificacion/${fundacionProfile.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 15 });

      expect(res.status).toBe(200);
      expect(res.body.result).toBeDefined();

      // Debe mostrar los 2 animales de nuevo (nueva suscripción)
      expect(res.body.result.length).toBe(2);
    });

    it('should create second report successfully after 30 days', async () => {
      const getAnimalsRes = await request(app)
        .get(`/fundacion/padrinos/calificacion/${fundacionProfile.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 15 });

      const animales = getAnimalsRes.body.result;
      const total_pago = animales.reduce((sum, a) => sum + (a.total || 0), 0);
      const total_comision = animales.reduce((sum, a) => sum + (a.montocomision || 0), 0);

      const res = await request(app)
        .post('/comision')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fundacionId: fundacionProfile.id,
          total_comision,
          total_pago,
          animales,
        });

      expect(res.status).toBe(200);
      expect(res.body.mensaje).toContain('Comision Creada exitosamente');

      // Verificar que ahora hay 2 comisiones (1 original + 1 después de 30 días)
      const comisiones = await db.Comision.findAll({
        where: { fundacion_id: fundacionProfile.id },
      });

      expect(comisiones.length).toBe(2);

      // Verificar registros en comision_manada para esta fundación
      const manadasResults = await Promise.all(comisiones.map(async (comision) => {
        const manadas = await db.ComisionManada.findAll({
          where: { comision_id: comision.id },
        });
        return manadas.length;
      }));

      const totalManadas = manadasResults.reduce((sum, len) => sum + len, 0);

      // 2 (primer reporte) + 2 (después 30 días) = 4
      expect(totalManadas).toBe(4);
    });
  });

  describe('Validation: Missing animals array', () => {
    it('should reject report without animals array', async () => {
      const res = await request(app)
        .post('/comision')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fundacionId: fundacionProfile.id,
          total_comision: 15,
          total_pago: 85,
          // animales: [] // Missing!
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('al menos un animal');
    });

    it('should reject report with empty animals array', async () => {
      const res = await request(app)
        .post('/comision')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fundacionId: fundacionProfile.id,
          total_comision: 15,
          total_pago: 85,
          animales: [], // Empty!
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('al menos un animal');
    });
  });

  afterAll(async () => {
    await db.disconnect();
  });
});

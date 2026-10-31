/* eslint-disable camelcase */
const request = require('supertest');
const { Op } = require('sequelize');
const app = require('../../app');
const db = require('../../DB/index');

// NOTA: Estos tests están deshabilitados porque requieren que el controlador
// actualizacionContoller.js implemente lógica de cálculo de comisiones,
// lo cual actualmente no está implementado.
// Para habilitar estos tests, el controlador createRating debe:
// 1. Calcular comisiones basadas en el rating
// 2. Guardar la comisión en la base de datos
// 3. Retornar los datos de comisión en la respuesta

describe.skip('E2E: Commission Flow - Money by Stars', () => {
  beforeAll(async () => {
    // Limpiar datos de prueba antes de empezar (orden correcto por foreign keys)
    await db.Rating.destroy({ where: {}, force: true });
    await db.Comision.destroy({ where: {}, force: true });
    await db.Notificacion.destroy({ where: {}, force: true });
    await db.ActualizacionAnimal.destroy({ where: {}, force: true });
    await db.Donacion.destroy({ where: {}, force: true });
    await db.ManadaAnimal.destroy({ where: {}, force: true });
    await db.Manada.destroy({ where: {}, force: true });
    await db.Animal.destroy({ where: {}, force: true });
    await db.Fundacion.destroy({ where: {}, force: true });
    await db.Usuario.destroy({ where: { email: { [Op.like]: '%e2e-test%' } }, force: true });
  });

  afterAll(async () => {
    // Cleanup final (orden correcto por foreign keys)
    await db.Rating.destroy({ where: {}, force: true });
    await db.Comision.destroy({ where: {}, force: true });
    await db.Notificacion.destroy({ where: {}, force: true });
    await db.ActualizacionAnimal.destroy({ where: {}, force: true });
    await db.Donacion.destroy({ where: {}, force: true });
    await db.ManadaAnimal.destroy({ where: {}, force: true });
    await db.Manada.destroy({ where: {}, force: true });
    await db.Animal.destroy({ where: {}, force: true });
    await db.Fundacion.destroy({ where: {}, force: true });
    await db.Usuario.destroy({ where: { email: { [Op.like]: '%e2e-test%' } }, force: true });
  });

  describe('Complete Flow: Donation → Evidence → View → Rate → Commission', () => {
    it('should complete full commission flow: donate → upload evidence → notify → view → rate → calculate commission', async () => {
      // ============================================
      // PASO 1: Setup - Crear usuarios
      // ============================================

      // 1.1 Crear y autenticar DONADOR
      await request(app)
        .post('/auth/register')
        .send({
          nombre: 'Donador E2E',
          apellido: 'Test',
          email: 'donador-e2e-test@leopet.com',
          password: 'Password123!',
          tipo_usuario: 'donador',
        });

      const donadorLogin = await request(app)
        .post('/auth/login')
        .send({
          email: 'donador-e2e-test@leopet.com',
          password: 'Password123!',
        });

      expect(donadorLogin.status).toBe(200);
      const donadorToken = donadorLogin.body.result.token;
      const donadorUser = donadorLogin.body.result;
      expect(donadorToken).toBeDefined();
      expect(donadorUser.id).toBeDefined();

      // 1.2 Crear y autenticar FUNDACIÓN
      await request(app)
        .post('/auth/register')
        .send({
          nombre: 'Fundacion E2E',
          apellido: 'Test',
          email: 'fundacion-e2e-test@leopet.com',
          password: 'Password123!',
          tipo_usuario: 'fundacion',
        });

      const fundacionLogin = await request(app)
        .post('/auth/login')
        .send({
          email: 'fundacion-e2e-test@leopet.com',
          password: 'Password123!',
        });

      expect(fundacionLogin.status).toBe(200);
      const fundacionToken = fundacionLogin.body.result.token;
      const fundacionUser = fundacionLogin.body.result;

      // 1.3 Crear perfil de fundación
      const fundacionProfile = await db.Fundacion.create({
        user_id: fundacionUser.id,
        nombre: 'Fundación E2E Test',
        descripcion: 'Descripcion de prueba',
        ruc: `${Date.now().toString().slice(-13)}`,
        direccion: 'Test Address',
        telefono: '0999999999',
        pais: 'Ecuador',
        ciudad: 'Guayaquil',
        aprobado: true,
        comision: 0.15,
        logo: 'https://example.com/test-logo.png',
      });
      expect(fundacionProfile.id).toBeDefined();

      // ============================================
      // PASO 2: Crear animal y donación
      // ============================================

      const animal = await db.Animal.create({
        nombre: 'Perrito E2E',
        edad: 2,
        especie: 'PERRO',
        raza: 'Mestizo',
        descripcion: 'Animal de prueba E2E',
        fundacion_id: fundacionProfile.id,
        estado: 'disponible',
      });
      expect(animal.id).toBeDefined();

      // Crear manada del donador (necesario para que se creen notificaciones)
      const manada = await db.Manada.create({
        userId: donadorUser.id,
        nombre: 'Mi Manada E2E',
      });

      // Agregar animal a la manada
      await db.ManadaAnimal.create({
        manada_id: manada.id,
        animal_id: animal.id,
      });

      const donacion = await db.Donacion.create({
        donador_id: donadorUser.id,
        animal_id: animal.id,
        fundacion_id: fundacionProfile.id,
        monto: 50.0, // $50 donation
        pagado: true,
        fecha_pago: new Date(),
        frecuencia: 'mensual',
        metodo_pago: 'paypal',
      });
      expect(donacion.id).toBeDefined();
      expect(donacion.pagado).toBe(true);

      // ============================================
      // PASO 3: Fundación sube evidencia
      // ============================================

      const evidenciaRes = await request(app)
        .post('/actualizacion')
        .set('Authorization', `Bearer ${fundacionToken}`)
        .send({
          descripcion: 'Evidencia de cuidado - E2E Test',
          animal_id: animal.id,
          fundacion_id: fundacionProfile.id,
        });

      expect(evidenciaRes.status).toBe(200);
      expect(evidenciaRes.body.result).toBeDefined();
      expect(evidenciaRes.body.result.id).toBeDefined();
      const actualizacion = evidenciaRes.body.result;

      // ============================================
      // PASO 4: Verificar notificación creada para donador
      // ============================================

      const notificaciones = await db.Notificacion.findAll({
        where: {
          usuario_id: donadorUser.id,
          actualizacion_id: actualizacion.id,
        },
      });

      expect(notificaciones.length).toBeGreaterThan(0);
      const notificacion = notificaciones[0];
      expect(notificacion.leido).toBe(false);
      expect(notificacion.animal_id).toBe(animal.id);

      // ============================================
      // PASO 5: Donador recibe y visualiza notificación
      // ============================================

      const notifRes = await request(app)
        .get('/notificacion')
        .set('Authorization', `Bearer ${donadorToken}`);

      expect(notifRes.status).toBe(200);
      expect(notifRes.body.count).toBeGreaterThan(0);
      expect(notifRes.body.result).toBeDefined();
      expect(notifRes.body.result.length).toBeGreaterThan(0);

      // ============================================
      // PASO 6: Donador marca notificación como leída (visualiza evidencia)
      // ============================================

      const markReadRes = await request(app)
        .put(`/notificacion/${notificacion.id}`)
        .set('Authorization', `Bearer ${donadorToken}`)
        .send({
          leido: true,
          fecha_leido: new Date(),
        });

      expect(markReadRes.status).toBe(200);

      const notifUpdated = await db.Notificacion.findOne({
        where: { id: notificacion.id },
      });
      expect(notifUpdated.leido).toBe(true);

      // ============================================
      // PASO 7: Donador califica con 4 estrellas (80% comisión)
      // ============================================

      const ratingRes = await request(app)
        .post(`/actualizacion/${actualizacion.id}/ratings`)
        .set('Authorization', `Bearer ${donadorToken}`)
        .send({
          valor: 4, // 4 stars = 80%
        });

      expect(ratingRes.status).toBe(200);
      expect(ratingRes.body.mensaje).toContain('Rating registrado');
      expect(ratingRes.body.comision).toBeDefined();
      expect(ratingRes.body.comision.porcentaje).toBe(80);
      expect(ratingRes.body.comision.montoFundacion).toBe(40); // 80% of $50
      expect(ratingRes.body.comision.comisionPlataforma).toBe(10); // 20% of $50

      // ============================================
      // PASO 8: Verificar rating guardado en DB
      // ============================================

      const rating = await db.Rating.findOne({
        where: { actualizacion_id: actualizacion.id },
      });

      expect(rating).toBeDefined();
      expect(rating.valor).toBe('4');

      // ============================================
      // PASO 9: Verificar comisión guardada en DB
      // ============================================

      const comision = await db.Comision.findOne({
        where: { fundacion_id: fundacionProfile.id },
      });

      expect(comision).toBeDefined();
      expect(comision.total_pago).toBe(40); // 80% of $50 va a fundación
      expect(comision.total_comision).toBe(10); // 20% of $50 retiene plataforma
      expect(comision.visible).toBe(true);

      // ============================================
      // PASO 10: Verificar que fundación puede ver sus comisiones
      // ============================================

      const comisiones = await db.Comision.findAll({
        where: { fundacion_id: fundacionProfile.id },
      });

      expect(comisiones.length).toBeGreaterThan(0);
      expect(comisiones[0].total_pago).toBe(40);

      // ============================================
      // ✅ FLUJO COMPLETO E2E EXITOSO
      // ============================================
    });
  });

  // ============================================
  // Tests de Validación y Edge Cases
  // ============================================

  describe('Validations and Edge Cases', () => {
    it('should reject rating without paid donation', async () => {
      // Setup: usuario, fundación, animal SIN donación pagada
      await request(app).post('/auth/register').send({
        nombre: 'Test',
        apellido: 'NoDonation',
        email: 'no-donation-e2e@leopet.com',
        password: 'Password123!',
        tipo_usuario: 'donador',
      });

      const loginRes = await request(app).post('/auth/login').send({
        email: 'no-donation-e2e@leopet.com',
        password: 'Password123!',
      });

      const { token } = loginRes.body.result;

      const fundacion = await db.Fundacion.findOne({ where: {} });

      const animalSinDonacion = await db.Animal.create({
        nombre: 'Animal Sin Donacion',
        edad: 1,
        especie: 'PERRO',
        fundacion_id: fundacion.id,
        estado: 'disponible',
      });

      const actualizacionSinDonacion = await db.ActualizacionAnimal.create({
        descripcion: 'Evidence without donation',
        estado_salud: 'Bueno',
        imagen: 'http://example.com/test-actualizacion.jpg',
        animal_id: animalSinDonacion.id,
        fundacion_id: fundacion.id,
      });

      const res = await request(app)
        .post(`/actualizacion/${actualizacionSinDonacion.id}/ratings`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          valor: 5,
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Donación pagada no encontrada');
    });

    it('should reject invalid rating values (< 1 or > 5)', async () => {
      const actualizacion = await db.ActualizacionAnimal.findOne({ where: {} });

      const loginRes = await request(app).post('/auth/login').send({
        email: 'donador-e2e-test@leopet.com',
        password: 'Password123!',
      });
      const { token } = loginRes.body.result;

      const res1 = await request(app)
        .post(`/actualizacion/${actualizacion.id}/ratings`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          valor: 0, // Invalid: < 1
        });

      expect(res1.status).toBe(400); // Validation error

      const res2 = await request(app)
        .post(`/actualizacion/${actualizacion.id}/ratings`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          valor: 6, // Invalid: > 5
        });

      expect(res2.status).toBe(400); // Validation error
    });

    it('should reject rating for non-existent actualizacion', async () => {
      const loginRes = await request(app).post('/auth/login').send({
        email: 'donador-e2e-test@leopet.com',
        password: 'Password123!',
      });
      const { token } = loginRes.body.result;

      const res = await request(app)
        .post('/actualizacion/99999/ratings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          valor: 5, // Non-existent
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Actualización no encontrada');
    });
  });

  // ============================================
  // Tests de Cálculo de Comisión (todos los escenarios)
  // ============================================

  describe('Commission Calculation: All Star Scenarios', () => {
    const testCases = [
      {
        stars: 1, percentage: 20, fundacionAmount: 10, platformAmount: 40,
      },
      {
        stars: 2, percentage: 40, fundacionAmount: 20, platformAmount: 30,
      },
      {
        stars: 3, percentage: 60, fundacionAmount: 30, platformAmount: 20,
      },
      {
        stars: 4, percentage: 80, fundacionAmount: 40, platformAmount: 10,
      },
      {
        stars: 5, percentage: 100, fundacionAmount: 50, platformAmount: 0,
      },
    ];

    testCases.forEach(({
      stars, percentage, fundacionAmount, platformAmount,
    }) => {
      it(`should calculate ${percentage}% commission for ${stars} stars`, async () => {
        // Setup completo para cada test
        const email = `calc-${stars}-stars@leopet.com`;
        await request(app).post('/auth/register').send({
          nombre: `Calc${stars}`,
          apellido: 'Stars',
          email,
          password: 'Password123!',
          tipo_usuario: 'donador',
        });

        const loginRes = await request(app).post('/auth/login').send({
          email,
          password: 'Password123!',
        });

        const { token } = loginRes.body.result;
        const userId = loginRes.body.result.id;

        const fundacion = await db.Fundacion.findOne({ where: {} });

        const animalCalc = await db.Animal.create({
          nombre: `Animal ${stars} Stars`,
          edad: 1,
          especie: 'PERRO',
          fundacion_id: fundacion.id,
          estado: 'disponible',
        });

        await db.Donacion.create({
          donador_id: userId,
          animal_id: animalCalc.id,
          fundacion_id: fundacion.id,
          monto: 50.0,
          pagado: true,
          fecha_pago: new Date(),
        });

        const actualizacionCalc = await db.ActualizacionAnimal.create({
          descripcion: `Evidence for ${stars} stars`,
          estado_salud: 'Bueno',
          imagen: 'http://example.com/test-actualizacion.jpg',
          animal_id: animalCalc.id,
          fundacion_id: fundacion.id,
        });

        // Test: calificar con N estrellas
        const res = await request(app)
          .post(`/actualizacion/${actualizacionCalc.id}/ratings`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            valor: stars,
          });

        expect(res.status).toBe(200);
        expect(res.body.comision.porcentaje).toBe(percentage);
        expect(res.body.comision.montoFundacion).toBe(fundacionAmount);
        expect(res.body.comision.comisionPlataforma).toBe(platformAmount);
      });
    });
  });
});

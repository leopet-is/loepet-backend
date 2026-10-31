/* eslint-disable camelcase */
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const app = require('../../app');
const db = require('../../DB/index');

// RUCs del flujo publico (solicitudes)
const RUC_NATURAL = '1710034065001';
const RUC_JURIDICA = '1790016919001';
const RUC_SOLICITUD = '3012345678001';
const RUCS_PUBLIC = [RUC_NATURAL, RUC_JURIDICA, RUC_SOLICITUD];

// RUCs del flujo de superadmin (fundaciones) - disjuntos de los publicos
const RUC_F_A = '1726119835001';
const RUC_F_B = '1790016919002';
const RUC_F_C = '0926687856001';
const RUCS_FUNDACION = [RUC_F_A, RUC_F_B, RUC_F_C];

const EMAIL_BASE = 'solicitud-v2';
const ADMIN_EMAIL = `${EMAIL_BASE}-admin@leopet.test`;

const payloadSolicitud = (ruc, email, overrides = {}) => ({
  ruc,
  nombre: 'Fundacion de Prueba',
  direccion: 'Quito, Ecuador',
  telefono: '0987654321',
  email_contacto: email,
  cedula_contacto: '1710034065',
  nombre_contacto: 'Ana',
  apellido_contacto: 'Gutierrez',
  ...overrides,
});

describe('Validacion de RUC, cédula y teléfono en solicitudes y fundaciones', () => {
  let adminToken;
  let adminUser;
  let fundacionAId;

  beforeAll(async () => {
    await db.connect();

    await db.Usuario.destroy({ where: { email: ADMIN_EMAIL } });

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Password123!', salt);
    adminUser = await db.Usuario.create({
      cedula: '1710034069',
      nombres: 'Admin',
      apellidos: 'Prueba',
      email: ADMIN_EMAIL,
      password: hash,
      role: 1,
      telefono: '0987654321',
      direccion: 'Quito',
    });
    adminToken = jwt.sign(adminUser.get({ plain: true }), 'secret', { expiresIn: 28800 });
  });

  afterAll(async () => {
    await db.Fundacion.destroy({ where: { ruc: { [Op.in]: [...RUCS_PUBLIC, ...RUCS_FUNDACION] } } });
    await db.SolicitudFundacion.destroy({ where: { ruc: { [Op.in]: [...RUCS_PUBLIC, ...RUCS_FUNDACION] } } });
    if (adminUser) {
      await db.AdminFund.destroy({ where: { id: adminUser.id } });
      await db.Usuario.destroy({ where: { id: adminUser.id } });
    }
    await db.disconnect();
  });

  describe('POST /public/solicitudes', () => {
    beforeAll(async () => {
      await db.Fundacion.destroy({ where: { ruc: { [Op.in]: RUCS_PUBLIC } } });
      await db.SolicitudFundacion.destroy({ where: { ruc: { [Op.in]: RUCS_PUBLIC } } });
    });

    afterAll(async () => {
      await db.Fundacion.destroy({ where: { ruc: { [Op.in]: RUCS_PUBLIC } } });
      await db.SolicitudFundacion.destroy({ where: { ruc: { [Op.in]: RUCS_PUBLIC } } });
    });

    it('crea una solicitud con datos validos (200)', async () => {
      const res = await request(app)
        .post('/public/solicitudes')
        .send(payloadSolicitud(RUC_NATURAL, `${EMAIL_BASE}@leopet.test`));

      expect(res.status).toBe(200);
      expect(res.body.mensaje).toBeDefined();
      expect(res.body.result.ruc).toBe(RUC_NATURAL);
    });

    it('rechaza una solicitud cuyo RUC ya se envio (409)', async () => {
      const res = await request(app)
        .post('/public/solicitudes')
        .send(payloadSolicitud(RUC_NATURAL, `${EMAIL_BASE}-otro@leopet.test`));

      expect(res.status).toBe(409);
    });

    it('rechaza una solicitud cuyo RUC pertenece a una fundacion registrada (409)', async () => {
      await db.Fundacion.create({
        ruc: RUC_JURIDICA,
        nombre: 'Fundacion Existente',
        direccion: 'Quito',
        telefono: '0987654321',
        aprobado: true,
        comision: 0,
      });

      const res = await request(app)
        .post('/public/solicitudes')
        .send(payloadSolicitud(RUC_JURIDICA, `${EMAIL_BASE}-otro2@leopet.test`));

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('fundación');
    });

    it('rechaza un RUC con formato invalido (400)', async () => {
      const res = await request(app)
        .post('/public/solicitudes')
        .send(payloadSolicitud('1234567890123', `${EMAIL_BASE}-ruc-invalido@leopet.test`));

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.errors[0].campo).toBe('ruc');
    });

    it('rechaza un RUC con verificador incorrecto (400)', async () => {
      const res = await request(app)
        .post('/public/solicitudes')
        .send(payloadSolicitud('1710034066001', `${EMAIL_BASE}-verif@leopet.test`));

      expect(res.status).toBe(400);
    });

    it('rechaza un email invalido (400)', async () => {
      const res = await request(app)
        .post('/public/solicitudes')
        .send(payloadSolicitud(
          RUC_SOLICITUD,
          `${EMAIL_BASE}-email@leopet.test`,
          { email_contacto: 'no-soy-un-email' },
        ));

      expect(res.status).toBe(400);
    });

    it('rechaza una cedula de contacto invalida (400)', async () => {
      const res = await request(app)
        .post('/public/solicitudes')
        .send(payloadSolicitud(
          RUC_SOLICITUD,
          `${EMAIL_BASE}-cedula@leopet.test`,
          { cedula_contacto: '1710034066' },
        ));

      expect(res.status).toBe(400);
    });

    it('rechaza un telefono con formato invalido (400)', async () => {
      const res = await request(app)
        .post('/public/solicitudes')
        .send(payloadSolicitud(
          RUC_SOLICITUD,
          `${EMAIL_BASE}-telefono@leopet.test`,
          { telefono: '1111111111' },
        ));

      expect(res.status).toBe(400);
    });

    it('rechaza el nombre de la fundacion vacio o solo espacios (400)', async () => {
      const res = await request(app)
        .post('/public/solicitudes')
        .send(payloadSolicitud(
          RUC_SOLICITUD,
          `${EMAIL_BASE}-nombre-vacio@leopet.test`,
          { nombre: '   ' },
        ));

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.errors[0].campo).toBe('nombre');
    });

    it('rechaza el nombre de contacto vacio o solo espacios (400)', async () => {
      const res = await request(app)
        .post('/public/solicitudes')
        .send(payloadSolicitud(
          RUC_SOLICITUD,
          `${EMAIL_BASE}-contacto-vacio@leopet.test`,
          { nombre_contacto: '' },
        ));

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.errors[0].campo).toBe('nombre_contacto');
    });

    it('rechaza el apellido de contacto vacio o solo espacios (400)', async () => {
      const res = await request(app)
        .post('/public/solicitudes')
        .send(payloadSolicitud(
          RUC_SOLICITUD,
          `${EMAIL_BASE}-apellido-vacio@leopet.test`,
          { apellido_contacto: '   ' },
        ));

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.errors[0].campo).toBe('apellido_contacto');
    });
  });

  describe('POST/PUT /fundacion', () => {
    beforeAll(async () => {
      await db.Fundacion.destroy({ where: { ruc: { [Op.in]: RUCS_FUNDACION } } });
      await db.SolicitudFundacion.destroy({ where: { ruc: { [Op.in]: RUCS_FUNDACION } } });
      const fundacion = await db.Fundacion.create({
        ruc: RUC_F_A,
        nombre: 'Fundacion Creada',
        direccion: 'Quito',
        telefono: '0987654321',
        aprobado: true,
        comision: 0,
      });
      fundacionAId = fundacion.id;
    });

    afterAll(async () => {
      await db.Fundacion.destroy({ where: { ruc: { [Op.in]: RUCS_FUNDACION } } });
      await db.SolicitudFundacion.destroy({ where: { ruc: { [Op.in]: RUCS_FUNDACION } } });
    });

    it('no expone un endpoint manual para crear fundaciones', async () => {
      const res = await request(app)
        .post('/fundacion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ruc: RUC_F_A,
          nombre: 'Fundacion Creada',
          direccion: 'Quito',
          telefono: '0987654321',
        });

      expect(res.status).toBe(404);
    });

    it('actualiza el RUC de una fundacion (200)', async () => {
      const res = await request(app)
        .put(`/fundacion/${fundacionAId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ruc: RUC_F_C, nombre: 'Fundacion Actualizada' });

      expect(res.status).toBe(200);
    });

    it('rechaza actualizar el RUC a uno de otra fundacion (409)', async () => {
      await db.Fundacion.create({
        ruc: RUC_F_B,
        nombre: 'Fundacion Con Ese RUC',
        direccion: 'Quito',
        telefono: '0987654321',
        aprobado: true,
        comision: 0,
      });

      const res = await request(app)
        .put(`/fundacion/${fundacionAId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ruc: RUC_F_B });

      expect(res.status).toBe(409);
    });

    it('rechaza actualizar el RUC con formato invalido (400)', async () => {
      const res = await request(app)
        .put(`/fundacion/${fundacionAId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ruc: '12345' });

      expect(res.status).toBe(400);
    });
  });
});
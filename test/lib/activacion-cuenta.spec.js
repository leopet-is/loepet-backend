/* eslint-disable camelcase */
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dayjs = require('dayjs');

const app = require('../../app');
const db = require('../../DB/index');
const { USUARIO_ESTADO } = require('../../constants');

const RUC = '0994055555001';
const EMAIL = 'activacion-test@leopet.test';
const ADMIN_EMAIL = 'activacion-admin@leopet.test';

const WITH_PASSWORD = 'Abcdef1@';

describe('Flujo de activacion de cuenta de fundacion', () => {
  let adminToken;
  let adminUser;
  let solicitudId;
  let tokenActivacion;
  let usuarioId;

  const payloadSolicitud = (overrides = {}) => ({
    ruc: RUC,
    nombre: 'Fundacion Activacion',
    direccion: 'Quito, Ecuador',
    telefono: '0987654321',
    email_contacto: EMAIL,
    cedula_contacto: '1710034065',
    nombre_contacto: 'Ana',
    apellido_contacto: 'Gutierrez',
    ...overrides,
  });

  beforeAll(async () => {
    await db.connect();

    // Limpieza previa de datos de prueba
    await db.Fundacion.destroy({ where: { ruc: RUC } });
    await db.SolicitudFundacion.destroy({ where: { ruc: RUC } });
    await db.Usuario.destroy({ where: { email: EMAIL } });
    await db.Usuario.destroy({ where: { email: ADMIN_EMAIL } });

    const hash = bcrypt.hashSync(WITH_PASSWORD, 10);
    adminUser = await db.Usuario.create({
      cedula: '1710034009',
      nombres: 'Admin',
      apellidos: 'Prueba',
      email: ADMIN_EMAIL,
      password: hash,
      role: 1,
      telefono: '0987654321',
      direccion: 'Quito',
    });
    adminToken = jwt.sign(adminUser.get({ plain: true }), 'secret', { expiresIn: 28800 });

    const solicitud = await db.SolicitudFundacion.create(payloadSolicitud());
    solicitudId = solicitud.id;
  });

  afterAll(async () => {
    await db.AdminFund.destroy({ where: { fundacion_id: (await db.Fundacion.findOne({ where: { ruc: RUC } }))?.id } });
    await db.Fundacion.destroy({ where: { ruc: RUC } });
    await db.SolicitudFundacion.destroy({ where: { ruc: RUC } });
    await db.Usuario.destroy({ where: { email: EMAIL } });
    if (adminUser) {
      await db.AdminFund.destroy({ where: { id: adminUser.id } });
      await db.Usuario.destroy({ where: { id: adminUser.id } });
    }
    await db.disconnect();
  });

  describe('PUT /admin/solicitudes/:id/aprobar', () => {
    it('aprueba la solicitud, crea la fundacion y el usuario pendiente (200)', async () => {
      const res = await request(app)
        .put(`/admin/solicitudes/${solicitudId}/aprobar`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.result.fundacion.ruc).toBe(RUC);
      // La fundacion guarda la solicitud que la origino
      expect(res.body.result.fundacion.solicitud_id).toBe(solicitudId);
      expect(res.body.result.usuario.email).toBe(EMAIL);
      expect(res.body.result.usuario.estado).toBe(USUARIO_ESTADO.PENDIENTE_ACTIVACION);
      // Campos sensibles no deben exponerse
      expect(res.body.result.usuario.password).toBeUndefined();
      expect(res.body.result.usuario.activation_token).toBeUndefined();

      const usuario = await db.Usuario.findOne({ where: { email: EMAIL } });
      usuarioId = usuario.id;

      const tokenRow = await db.TokenActivacion.findOne({ where: { usuario_id: usuarioId } });
      expect(tokenRow).toBeTruthy();
      tokenActivacion = tokenRow.token;
      expect(tokenRow.expires_at).toBeTruthy();
      expect(tokenRow.usado).toBe(false);
      expect(usuario.password).toBeNull();
    });

    it('no permite aprobar la misma solicitud dos veces (409)', async () => {
      const res = await request(app)
        .put(`/admin/solicitudes/${solicitudId}/aprobar`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
    });
  });

  describe('No puede iniciar sesion sin activar', () => {
    it('rechaza el inicio de sesion de la cuenta pendiente (401)', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: EMAIL, password: 'Cualquier1@' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/validar-token-activacion', () => {
    it('valida un token vigente (200)', async () => {
      const res = await request(app)
        .get('/auth/validar-token-activacion')
        .query({ token: tokenActivacion });

      expect(res.status).toBe(200);
      expect(res.body.valido).toBe(true);
    });

    it('rechaza un token inexistente (400)', async () => {
      const res = await request(app)
        .get('/auth/validar-token-activacion')
        .query({ token: 'token-que-no-existe' });

      expect(res.status).toBe(400);
      expect(res.body.valido).toBe(false);
    });

    it('rechaza un token expirado (410)', async () => {
      await db.TokenActivacion.update(
        { expires_at: dayjs().subtract(1, 'hour').toDate() },
        { where: { usuario_id: usuarioId } },
      );

      const res = await request(app)
        .get('/auth/validar-token-activacion')
        .query({ token: tokenActivacion });

      expect(res.status).toBe(410);

      // Restaurar vigencia para el resto de pruebas
      await db.TokenActivacion.update(
        { expires_at: dayjs().add(24, 'hour').toDate() },
        { where: { usuario_id: usuarioId } },
      );
    });
  });

  describe('POST /auth/activar-cuenta', () => {
    it('rechaza una contrasena debil (400)', async () => {
      const res = await request(app)
        .post('/auth/activar-cuenta')
        .send({ token: tokenActivacion, password: 'corta' });

      expect(res.status).toBe(400);
    });

    it('activa la cuenta con contrasena valida (200)', async () => {
      const res = await request(app)
        .post('/auth/activar-cuenta')
        .send({ token: tokenActivacion, password: WITH_PASSWORD });

      expect(res.status).toBe(200);

      const usuario = await db.Usuario.findOne({ where: { email: EMAIL } });
      const tokenRow = await db.TokenActivacion.findOne({ where: { usuario_id: usuario.id } });
      expect(usuario.estado).toBe(USUARIO_ESTADO.ACTIVO);
      // El token ya no vive en usuario: se invalida marcandolo como usado
      expect(usuario.activation_token).toBeUndefined();
      expect(tokenRow.usado).toBe(true);
      expect(bcrypt.compareSync(WITH_PASSWORD, usuario.password)).toBe(true);
    });

    it('rechaza reutilizar el token tras activar la cuenta (400)', async () => {
      const res = await request(app)
        .post('/auth/activar-cuenta')
        .send({ token: tokenActivacion, password: WITH_PASSWORD });

      expect(res.status).toBe(400);
    });
  });

  describe('Sesion tras la activacion', () => {
    it('permite iniciar sesion con la nueva contrasena (200)', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: EMAIL, password: WITH_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.result.email).toBe(EMAIL);
    });
  });
});
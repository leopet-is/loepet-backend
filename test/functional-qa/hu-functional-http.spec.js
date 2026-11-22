const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

const db = require('../../DB/index');
const { ROL, USUARIO_ESTADO, SOLICITUD_FUNDACION_ESTADO } = require('../../constants');

jest.setTimeout(180000);

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:8181';
const EVIDENCE_PATH = path.join(__dirname, 'evidence.json');
const PASSWORD = 'Password123!';

const ADMIN_EMAIL = 'qa-admin@leopet.test';
const DONOR_EMAIL = 'qa-donor@leopet.test';
const FOUNDATION_EMAIL = 'qa-fundacion@leopet.test';
const REJECTED_EMAIL = 'qa-rechazada@leopet.test';
const EMPTY_EMAIL = 'qa-vacia@leopet.test';
const EMAILS = [ADMIN_EMAIL, DONOR_EMAIL, FOUNDATION_EMAIL, REJECTED_EMAIL, EMPTY_EMAIL];
const CEDULAS = ['1710034069', '1710034065', '0909090904', '3012345678', '0926687856'];
const RUCS = ['1726119835001', '1790016919002', '3012345678001'];

const RUC_APROBADA = RUCS[0];
const RUC_RECHAZADA = RUCS[1];
const RUC_VACIA = RUCS[2];

const evidencias = [];

function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, item]) => ({
      ...acc,
      [key]: ['password', 'token', 'authorization'].includes(key.toLowerCase())
        ? '[REDACTED]'
        : sanitize(item),
    }), {});
  }
  return value;
}

function record({
  id, tecnica, hu, caso, method, endpoint, body, tokenRole, response, esperado, resultado,
}) {
  evidencias.push({
    id,
    tecnica,
    hu,
    caso,
    ejecutadoEn: new Date().toISOString(),
    baseUrl: BASE_URL,
    request: {
      method,
      endpoint,
      body: sanitize(body || null),
      tokenRole: tokenRole || 'publico',
    },
    response: {
      status: response.status,
      body: sanitize(response.body),
    },
    esperado,
    resultado,
  });
}

function assertStatus(response, status) {
  expect(response.status).toBe(status);
  return response;
}

async function api(method, endpoint, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  let parsed = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  return { status: response.status, body: parsed };
}

function solicitudBody(ruc, email, cedula) {
  return {
    ruc,
    nombre: `QA Fundacion ${ruc}`,
    direccion: 'Quito, Ecuador',
    telefono: '0987654321',
    email_contacto: email,
    cedula_contacto: cedula,
    nombre_contacto: 'Ana',
    apellido_contacto: 'Perez',
    comentarios: 'Prueba funcional QA',
  };
}

function animalBody(nombre, especie, status, montoMeta) {
  return {
    nombre,
    especie,
    sexo: 'HEMBRA',
    raza: 'Mestizo',
    descripcion: 'Animal de prueba funcional',
    historia: 'Rescatado en prueba QA',
    imagen: '/images/qa.png',
    galeria: ['/images/qa.png'],
    status,
    monto_meta_mensual: montoMeta.toFixed(2),
    monto_recaudado_actual: '0.00',
    enfermedades: 'Ninguna',
    vacunacion: true,
    visible: true,
  };
}

const run = process.env.QA_BASE_URL ? describe : describe.skip;

run('QA funcional HTTP - HUs Sprint 1 y 2', () => {
  let adminUser;
  let adminToken;
  let donorUser;
  let donorToken;
  let foundationToken;
  let fundacionId;
  let fundacionVaciaId;
  let solicitudId;
  let solicitudRechazadaId;
  let activatedUserId;
  let animalUrgente;
  let animalNormal;
  let animalGato;
  let manadaId;
  let actualizacionId;

  beforeAll(async () => {
    await db.connect();

    const health = await api('GET', '/api/health');
    record({
      id: 'INFRA-01',
      tecnica: 'Smoke',
      hu: 'Infraestructura',
      caso: 'Backend responde health check',
      method: 'GET',
      endpoint: '/api/health',
      response: health,
      esperado: '200 OK',
      resultado: health.status === 200 ? 'PASS' : 'FAIL',
    });
    assertStatus(health, 200);

    const usuariosPrevios = await db.Usuario.findAll({
      where: { [Op.or]: [{ email: { [Op.in]: EMAILS } }, { cedula: { [Op.in]: CEDULAS } }] },
      attributes: ['id'],
    });
    const usuarioIds = usuariosPrevios.map((usuario) => usuario.id);
    const fundacionesPrevias = await db.Fundacion.findAll({
      where: { ruc: { [Op.in]: RUCS } }, attributes: ['id'],
    });
    const fundacionIds = fundacionesPrevias.map((fundacion) => fundacion.id);
    const manadasPrevias = await db.Manada.findAll({
      where: { userId: { [Op.in]: usuarioIds } }, attributes: ['id'],
    });
    const manadaIds = manadasPrevias.map((manada) => manada.id);

    await db.RatingActualizacion.destroy({ where: { userId: { [Op.in]: usuarioIds } } });
    await db.ActualizacionAnimal.destroy({ where: { fundacion_id: { [Op.in]: fundacionIds } } });
    await db.ComisionManada.destroy({ where: { manada_id: { [Op.in]: manadaIds } } });
    await db.Comision.destroy({ where: { fundacion_id: { [Op.in]: fundacionIds } } });
    await db.Donacion.destroy({ where: { donador_id: { [Op.in]: usuarioIds } } });
    await db.ManadaAnimal.destroy({ where: { manada_id: { [Op.in]: manadaIds } } });
    await db.SuscripcionPadrino.destroy({ where: { manadaId: { [Op.in]: manadaIds } } });
    await db.Manada.destroy({ where: { id: { [Op.in]: manadaIds } } });
    await db.Animal.destroy({ where: { fundacion_id: { [Op.in]: fundacionIds } } });
    await db.TokenActivacion.destroy({ where: { usuario_id: { [Op.in]: usuarioIds } } });
    await db.AdminFund.destroy({ where: { id: { [Op.in]: usuarioIds } } });
    await db.Usuario.destroy({ where: { id: { [Op.in]: usuarioIds } } });
    await db.Fundacion.destroy({ where: { id: { [Op.in]: fundacionIds } } });
    await db.SolicitudFundacion.destroy({ where: { ruc: { [Op.in]: RUCS } } });

    adminUser = await db.Usuario.create({
      cedula: CEDULAS[0],
      nombres: 'QA',
      apellidos: 'Admin',
      email: ADMIN_EMAIL,
      password: bcrypt.hashSync(PASSWORD, 10),
      telefono: '0987654321',
      role: ROL.ADMIN.ROL_ID,
      estado: USUARIO_ESTADO.ACTIVO,
    });

    const adminLogin = await api('POST', '/auth/login', { body: { email: ADMIN_EMAIL, password: PASSWORD } });
    adminToken = adminLogin.body.result.token;
    record({
      id: 'TC-01',
      tecnica: 'Decision Table',
      hu: 'HU-ADM-1',
      caso: 'Login admin con credenciales validas',
      method: 'POST',
      endpoint: '/auth/login',
      body: { email: ADMIN_EMAIL, password: PASSWORD },
      response: adminLogin,
      esperado: '200 con token',
      resultado: adminLogin.status === 200 && Boolean(adminToken) ? 'PASS' : 'FAIL',
    });
    assertStatus(adminLogin, 200);

    const donorRegister = await api('POST', '/auth/register', {
      body: {
        cedula: CEDULAS[1],
        nombres: 'QA',
        apellidos: 'Donador',
        telefono: '0987654321',
        email: DONOR_EMAIL,
        password: PASSWORD,
        role: ROL.DONADOR.ROL_ID,
      },
    });
    donorUser = donorRegister.body.result;
    donorToken = donorUser.token;
    record({
      id: 'TC-01',
      tecnica: 'Decision Table',
      hu: 'HU-DON-1',
      caso: 'Registro y login donador',
      method: 'POST',
      endpoint: '/auth/register',
      body: { email: DONOR_EMAIL, role: ROL.DONADOR.ROL_ID },
      response: donorRegister,
      esperado: '200 con token role=3',
      resultado: donorRegister.status === 200 && donorUser.role === 3 ? 'PASS' : 'FAIL',
    });
    assertStatus(donorRegister, 200);

    const donorLogin = await api('POST', '/auth/login', { body: { email: DONOR_EMAIL, password: PASSWORD } });
    record({
      id: 'TC-01',
      tecnica: 'Decision Table',
      hu: 'HU-DON-1',
      caso: 'Login donador con credenciales validas',
      method: 'POST',
      endpoint: '/auth/login',
      body: { email: DONOR_EMAIL, password: PASSWORD },
      response: donorLogin,
      esperado: '200 con token',
      resultado: donorLogin.status === 200 ? 'PASS' : 'FAIL',
    });
    assertStatus(donorLogin, 200);

    const solicitud = await api('POST', '/public/solicitudes', {
      body: solicitudBody(RUC_APROBADA, FOUNDATION_EMAIL, CEDULAS[2]),
    });
    solicitudId = solicitud.body.result.id;
    record({
      id: 'TC-03',
      tecnica: 'Decision Table',
      hu: 'HU-ADM-2',
      caso: 'Solicitud de fundacion creada',
      method: 'POST',
      endpoint: '/public/solicitudes',
      body: { ruc: RUC_APROBADA },
      response: solicitud,
      esperado: '200 con solicitud pendiente',
      resultado: solicitud.status === 200 ? 'PASS' : 'FAIL',
    });
    assertStatus(solicitud, 200);

    const aprobacion = await api('PUT', `/admin/solicitudes/${solicitudId}/aprobar`, { token: adminToken });
    fundacionId = aprobacion.body.result.fundacion.id;
    activatedUserId = aprobacion.body.result.usuario.id;
    record({
      id: 'TC-03',
      tecnica: 'Decision Table',
      hu: 'HU-ADM-2',
      caso: 'Admin aprueba solicitud',
      method: 'PUT',
      endpoint: `/admin/solicitudes/${solicitudId}/aprobar`,
      tokenRole: 'admin',
      response: aprobacion,
      esperado: '200 con fundacion y usuario pendiente de activacion',
      resultado: aprobacion.status === 200 ? 'PASS' : 'FAIL',
    });
    assertStatus(aprobacion, 200);

    const tokenRow = await db.TokenActivacion.findOne({ where: { usuario_id: activatedUserId } });
    expect(tokenRow).not.toBeNull();
    const activacion = await api('POST', '/auth/activar-cuenta', {
      body: { token: tokenRow.token, password: PASSWORD },
    });
    record({
      id: 'TC-03',
      tecnica: 'Decision Table',
      hu: 'HU-ADM-2',
      caso: 'Fundacion activa su cuenta',
      method: 'POST',
      endpoint: '/auth/activar-cuenta',
      body: { password: PASSWORD, token: tokenRow.token },
      response: activacion,
      esperado: '200 cuenta activada',
      resultado: activacion.status === 200 ? 'PASS' : 'FAIL',
    });
    assertStatus(activacion, 200);

    const foundationLogin = await api('POST', '/auth/login', {
      body: { email: FOUNDATION_EMAIL, password: PASSWORD },
    });
    foundationToken = foundationLogin.body.result.token;
    record({
      id: 'TC-02',
      tecnica: 'Decision Table',
      hu: 'HU-FND-1',
      caso: 'Login fundacion activada',
      method: 'POST',
      endpoint: '/auth/login',
      body: { email: FOUNDATION_EMAIL, password: PASSWORD },
      response: foundationLogin,
      esperado: '200 con token role=2 y fundacionId',
      resultado: foundationLogin.status === 200 && Boolean(fundacionId) ? 'PASS' : 'FAIL',
    });
    assertStatus(foundationLogin, 200);

    const solicitudRechazada = await api('POST', '/public/solicitudes', {
      body: solicitudBody(RUC_RECHAZADA, REJECTED_EMAIL, CEDULAS[3]),
    });
    solicitudRechazadaId = solicitudRechazada.body.result.id;
    assertStatus(solicitudRechazada, 200);

    const rechazo = await api('PUT', `/admin/solicitudes/${solicitudRechazadaId}/rechazar`, {
      token: adminToken,
      body: { notas_admin: 'QA - solicitud duplicada' },
    });
    record({
      id: 'TC-03',
      tecnica: 'Decision Table',
      hu: 'HU-ADM-2',
      caso: 'Admin rechaza solicitud',
      method: 'PUT',
      endpoint: `/admin/solicitudes/${solicitudRechazadaId}/rechazar`,
      body: { notas_admin: 'QA - solicitud duplicada' },
      tokenRole: 'admin',
      response: rechazo,
      esperado: '200 con solicitud rechazada y sin fundacion',
      resultado: rechazo.status === 200 ? 'PASS' : 'FAIL',
    });
    assertStatus(rechazo, 200);

    const solicitudVacia = await api('POST', '/public/solicitudes', {
      body: solicitudBody(RUC_VACIA, EMPTY_EMAIL, CEDULAS[4]),
    });
    assertStatus(solicitudVacia, 200);
    const aprobacionVacia = await api('PUT', `/admin/solicitudes/${solicitudVacia.body.result.id}/aprobar`, {
      token: adminToken,
    });
    fundacionVaciaId = aprobacionVacia.body.result.fundacion.id;
    assertStatus(aprobacionVacia, 200);

    const urgente = await api('POST', '/animal', {
      token: foundationToken,
      body: animalBody('QA Urgente', 'PERRO', 'EN_TRATAMIENTO', 500),
    });
    animalUrgente = urgente.body.result;
    assertStatus(urgente, 200);

    const normal = await api('POST', '/animal', {
      token: foundationToken,
      body: animalBody('QA Normal', 'PERRO', 'REQUIERE_PADRINOS', 50),
    });
    animalNormal = normal.body.result;
    assertStatus(normal, 200);

    const gato = await api('POST', '/animal', {
      token: foundationToken,
      body: animalBody('QA Gato', 'GATO', 'REQUIERE_PADRINOS', 80),
    });
    animalGato = gato.body.result;
    assertStatus(gato, 200);
    record({
      id: 'HU-FND-2',
      tecnica: 'EP',
      hu: 'HU-FND-2',
      caso: 'Fundacion publica tres animales',
      method: 'POST',
      endpoint: '/animal',
      body: { especie: 'PERRO/GATO' },
      tokenRole: 'fundacion',
      response: gato,
      esperado: '200 con galeria e historia persistidos',
      resultado: gato.status === 200 ? 'PASS' : 'FAIL',
    });

    const manada = await api('POST', '/manada', {
      token: donorToken,
      body: { nombre: 'Manada QA', monto: '100.00' },
    });
    manadaId = manada.body.manada.id;
    record({
      id: 'TC-05',
      tecnica: 'Decision Table',
      hu: 'HU-DON-7',
      caso: 'Donador crea manada con monto valido',
      method: 'POST',
      endpoint: '/manada',
      body: { nombre: 'Manada QA', monto: '100.00' },
      tokenRole: 'donador',
      response: manada,
      esperado: '200 con manada',
      resultado: manada.status === 200 ? 'PASS' : 'FAIL',
    });
    assertStatus(manada, 200);

    const addAnimals = await api('POST', `/manada/${manadaId}/animals`, {
      token: donorToken,
      body: { animalId: [animalUrgente.id, animalNormal.id] },
    });
    record({
      id: 'TC-05',
      tecnica: 'Decision Table',
      hu: 'HU-DON-7',
      caso: 'Agregar 2 animales a la manada',
      method: 'POST',
      endpoint: `/manada/${manadaId}/animals`,
      body: { animalId: [animalUrgente.id, animalNormal.id] },
      tokenRole: 'donador',
      response: addAnimals,
      esperado: '200 con relacion creada',
      resultado: addAnimals.status === 200 ? 'PASS' : 'FAIL',
    });
    assertStatus(addAnimals, 200);

    const actualizacion = await api('POST', '/actualizacion/', {
      token: foundationToken,
      body: {
        animal_id: animalUrgente.id,
        fundacion_id: fundacionId,
        descripcion: 'Actualizacion QA',
        estado_salud: 'Estable',
        imagen: '/images/qa-update.png',
      },
    });
    actualizacionId = actualizacion.body.result.id;
    record({
      id: 'TC-06',
      tecnica: 'Decision Table',
      hu: 'Transversal/Comisiones',
      caso: 'Fundacion crea actualizacion',
      method: 'POST',
      endpoint: '/actualizacion/',
      body: { animal_id: animalUrgente.id },
      tokenRole: 'fundacion',
      response: actualizacion,
      esperado: '200 con actualizacion',
      resultado: actualizacion.status === 200 ? 'PASS' : 'FAIL',
    });
    assertStatus(actualizacion, 200);
  }, 180000);

  afterAll(async () => {
    try {
      const resumen = evidencias.reduce((acc, evidencia) => {
        const clave = evidencia.resultado;
        acc[clave] = (acc[clave] || 0) + 1;
        return acc;
      }, {});
      fs.writeFileSync(EVIDENCE_PATH, JSON.stringify({
        baseUrl: BASE_URL,
        generadoEn: new Date().toISOString(),
        totalEvidencias: evidencias.length,
        resumen,
        evidencias,
      }, null, 2));
      console.log(`Evidencia QA escrita en ${EVIDENCE_PATH}`);
      console.log(JSON.stringify(resumen));
    } catch (error) {
      console.log(`No se pudo escribir evidencia: ${error.message}`);
    }

    try {
      await db.RatingActualizacion.destroy({ where: { userId: donorUser ? [donorUser.id] : [] } });
      await db.ActualizacionAnimal.destroy({ where: { fundacion_id: fundacionId ? [fundacionId] : [] } });
      await db.ComisionManada.destroy({ where: { manada_id: manadaId ? [manadaId] : [] } });
      await db.Comision.destroy({ where: { fundacion_id: fundacionId ? [fundacionId] : [] } });
      await db.Donacion.destroy({ where: { donador_id: donorUser ? [donorUser.id] : [] } });
      await db.ManadaAnimal.destroy({ where: { manada_id: manadaId ? [manadaId] : [] } });
      await db.SuscripcionPadrino.destroy({ where: { manadaId: manadaId ? [manadaId] : [] } });
      await db.Manada.destroy({ where: { id: manadaId ? [manadaId] : [] } });
      await db.Animal.destroy({ where: { fundacion_id: fundacionId ? [fundacionId] : [] } });
      await db.TokenActivacion.destroy({ where: { usuario_id: activatedUserId ? [activatedUserId] : [] } });
      await db.AdminFund.destroy({ where: { id: activatedUserId ? [activatedUserId] : [] } });
      const usuariosFinales = [adminUser, donorUser, activatedUserId]
        .filter(Boolean)
        .map((usuario) => usuario.id);
      await db.Usuario.destroy({ where: { id: usuariosFinales } });
      await db.Fundacion.destroy({ where: { ruc: RUCS } });
      await db.SolicitudFundacion.destroy({ where: { ruc: RUCS } });
      await db.sequelize.close();
    } catch (error) {
      console.log(`Warning cleanup QA: ${error.message}`);
    }
  }, 180000);

  it('TC-01 - Particiones de login y estado de cuenta (HU-DON-1/HU-FND-1/HU-ADM-1)', async () => {
    const wrongPassword = await api('POST', '/auth/login', {
      body: { email: DONOR_EMAIL, password: 'Wrong123!' },
    });
    record({
      id: 'TC-01',
      tecnica: 'Decision Table',
      hu: 'HU-DON-1',
      caso: 'Password incorrecto',
      method: 'POST',
      endpoint: '/auth/login',
      body: { email: DONOR_EMAIL, password: 'Wrong123!' },
      response: wrongPassword,
      esperado: '401',
      resultado: wrongPassword.status === 401 ? 'PASS' : 'FAIL',
    });
    assertStatus(wrongPassword, 401);

    const unknownEmail = await api('POST', '/auth/login', {
      body: { email: 'no-existe-qa@leopet.test', password: PASSWORD },
    });
    record({
      id: 'TC-01',
      tecnica: 'Decision Table',
      hu: 'HU-DON-1',
      caso: 'Email inexistente',
      method: 'POST',
      endpoint: '/auth/login',
      body: { email: 'no-existe-qa@leopet.test' },
      response: unknownEmail,
      esperado: '401',
      resultado: unknownEmail.status === 401 ? 'PASS' : 'FAIL',
    });
    assertStatus(unknownEmail, 401);

    const disable = await api('PUT', `/usuario/${donorUser.id}/status`, {
      token: adminToken,
      body: { estado: USUARIO_ESTADO.INACTIVO },
    });
    record({
      id: 'TC-01',
      tecnica: 'Decision Table',
      hu: 'HU-ADM-1',
      caso: 'Admin deshabilita donador',
      method: 'PUT',
      endpoint: `/usuario/${donorUser.id}/status`,
      body: { estado: USUARIO_ESTADO.INACTIVO },
      tokenRole: 'admin',
      response: disable,
      esperado: '200 estado INACTIVO',
      resultado: disable.status === 200 ? 'PASS' : 'FAIL',
    });
    assertStatus(disable, 200);

    const disabledLogin = await api('POST', '/auth/login', {
      body: { email: DONOR_EMAIL, password: PASSWORD },
    });
    record({
      id: 'TC-01',
      tecnica: 'Decision Table',
      hu: 'HU-DON-1',
      caso: 'Login con cuenta deshabilitada',
      method: 'POST',
      endpoint: '/auth/login',
      body: { email: DONOR_EMAIL },
      response: disabledLogin,
      esperado: '401 Usuario deshabilitado',
      resultado: disabledLogin.status === 401 ? 'PASS' : 'FAIL',
    });
    assertStatus(disabledLogin, 401);

    const enable = await api('PUT', `/usuario/${donorUser.id}/status`, {
      token: adminToken,
      body: { estado: USUARIO_ESTADO.ACTIVO },
    });
    assertStatus(enable, 200);

    const foundationForbidden = await api('POST', '/manada', {
      token: foundationToken,
      body: { nombre: 'Manada no permitida', monto: '10.00' },
    });
    record({
      id: 'TC-02',
      tecnica: 'Decision Table',
      hu: 'HU-FND-1',
      caso: 'Fundacion intenta acceder a accion de donador',
      method: 'POST',
      endpoint: '/manada',
      body: { nombre: 'Manada no permitida', monto: '10.00' },
      tokenRole: 'fundacion',
      response: foundationForbidden,
      esperado: '403',
      resultado: foundationForbidden.status === 403 ? 'PASS' : 'FAIL',
    });
    assertStatus(foundationForbidden, 403);
  });

  it('TC-02 - Valores limite de intentos fallidos (HU-ADM-1)', async () => {
    const intentos = await Promise.all([1, 2, 3, 4].map(async (numero) => {
      const response = await api('POST', '/auth/login', {
        body: { email: ADMIN_EMAIL, password: `Wrong${numero}!` },
      });
      return { numero, response };
    }));

    intentos.forEach(({ numero, response }) => {
      let resultado = 'FAIL';
      if (response.status === 401 && numero >= 3) resultado = 'GAP';
      else if (response.status === 401) resultado = 'PASS';
      record({
        id: 'TC-02',
        tecnica: 'BVA',
        hu: 'HU-ADM-1',
        caso: `Intento fallido ${numero}`,
        method: 'POST',
        endpoint: '/auth/login',
        body: { email: ADMIN_EMAIL },
        response,
        esperado: numero >= 3 ? '401 y bloqueo tras 3 intentos' : '401',
        resultado,
      });
    });

    expect(intentos.map((intento) => intento.response.status)).toEqual([401, 401, 401, 401]);
    expect(String(intentos[3].response.body)).not.toMatch(/bloque/i);
  });

  it('TC-03 - Aprobacion vs rechazo de solicitudes (HU-ADM-2)', async () => {
    const solicitudAprobada = await db.SolicitudFundacion.findByPk(solicitudId);
    const solicitudRechazada = await db.SolicitudFundacion.findByPk(solicitudRechazadaId);
    const fundacionAprobada = await db.Fundacion.findByPk(fundacionId);
    const fundacionRechazada = await db.Fundacion.findOne({ where: { ruc: RUC_RECHAZADA } });
    const usuarioRechazado = await db.Usuario.findOne({ where: { email: REJECTED_EMAIL } });

    expect(solicitudAprobada.estado).toBe(SOLICITUD_FUNDACION_ESTADO.APROBADA);
    expect(solicitudRechazada.estado).toBe(SOLICITUD_FUNDACION_ESTADO.RECHAZADA);
    expect(fundacionAprobada).not.toBeNull();
    expect(fundacionRechazada).toBeNull();
    expect(usuarioRechazado).toBeNull();

    const listado = await api('GET', '/admin/solicitudes?limit=100', { token: adminToken });
    record({
      id: 'TC-03',
      tecnica: 'Decision Table',
      hu: 'HU-ADM-2',
      caso: 'Listado admin refleja estados',
      method: 'GET',
      endpoint: '/admin/solicitudes?limit=100',
      tokenRole: 'admin',
      response: listado,
      esperado: '200 con solicitudes aprobada y rechazada',
      resultado: listado.status === 200 && listado.body.result.length >= 3 ? 'PASS' : 'FAIL',
    });
    assertStatus(listado, 200);
  });

  it('TC-04 - Clasificacion y prioridad del catalogo (HU-DON-3)', async () => {
    const porEspecie = await api('GET', `/animal?fundacionId=${fundacionId}&especie=PERRO`);
    record({
      id: 'TC-04',
      tecnica: 'EP',
      hu: 'HU-DON-3',
      caso: 'Filtro por especie PERRO',
      method: 'GET',
      endpoint: `/animal?fundacionId=${fundacionId}&especie=PERRO`,
      response: porEspecie,
      esperado: '200 solo perros',
      resultado: porEspecie.status === 200 && porEspecie.body.result.every((a) => a.especie === 'PERRO') ? 'PASS' : 'FAIL',
    });
    assertStatus(porEspecie, 200);
    expect(porEspecie.body.result.every((animal) => animal.especie === 'PERRO')).toBe(true);

    const porManada = await api('GET', `/animal?manada=${manadaId}`, { token: donorToken });
    record({
      id: 'TC-04',
      tecnica: 'EP',
      hu: 'HU-DON-3',
      caso: 'Filtro por manada',
      method: 'GET',
      endpoint: `/animal?manada=${manadaId}`,
      tokenRole: 'donador',
      response: porManada,
      esperado: '200 animales de la manada',
      resultado: porManada.status === 200 ? 'PASS' : 'FAIL',
    });
    assertStatus(porManada, 200);
    expect(porManada.body.result.length).toBe(2);

    const prioritario = await api('GET', `/animal?fundacionId=${fundacionId}`);
    record({
      id: 'TC-04',
      tecnica: 'Decision Table',
      hu: 'HU-DON-3',
      caso: 'EN_TRATAMIENTO aparece antes que REQUIERE_PADRINOS',
      method: 'GET',
      endpoint: `/animal?fundacionId=${fundacionId}`,
      response: prioritario,
      esperado: 'Primer resultado en tratamiento',
      resultado: prioritario.body.result[0].status === 'EN_TRATAMIENTO' ? 'PASS' : 'FAIL',
    });
    assertStatus(prioritario, 200);
    expect(prioritario.body.result[0].status).toBe('EN_TRATAMIENTO');

    const cambioStatus = await api('PUT', `/animal/${animalUrgente.id}`, {
      token: foundationToken,
      body: { status: 'APADRINADO' },
    });
    assertStatus(cambioStatus, 200);

    const trasCambio = await api('GET', `/animal?fundacionId=${fundacionId}`);
    record({
      id: 'TC-04',
      tecnica: 'Decision Table',
      hu: 'HU-DON-3',
      caso: 'Orden cambia tras apadrinamiento',
      method: 'GET',
      endpoint: `/animal?fundacionId=${fundacionId}`,
      response: trasCambio,
      esperado: 'Primer resultado REQUIERE_PADRINOS',
      resultado: trasCambio.body.result[0].status === 'REQUIERE_PADRINOS' ? 'PASS' : 'FAIL',
    });
    assertStatus(trasCambio, 200);
    expect(trasCambio.body.result[0].status).toBe('REQUIERE_PADRINOS');
  });

  it('TC-04 - Filtros, bordes de paginacion y mensajes vacios (HU-DON-2/HU-DON-4)', async () => {
    const paginaCero = await api('GET', '/animal?page=0');
    record({
      id: 'TC-04',
      tecnica: 'BVA',
      hu: 'HU-DON-4',
      caso: 'page=0 fuera de rango',
      method: 'GET',
      endpoint: '/animal?page=0',
      response: paginaCero,
      esperado: '400',
      resultado: paginaCero.status === 400 ? 'PASS' : 'FAIL',
    });
    assertStatus(paginaCero, 400);

    const paginaUno = await api('GET', '/animal?page=1&limit=1');
    record({
      id: 'TC-04',
      tecnica: 'BVA',
      hu: 'HU-DON-4',
      caso: 'page=1 limite inferior',
      method: 'GET',
      endpoint: '/animal?page=1&limit=1',
      response: paginaUno,
      esperado: '200 maximo 1 resultado',
      resultado: paginaUno.status === 200 && paginaUno.body.result.length <= 1 ? 'PASS' : 'FAIL',
    });
    assertStatus(paginaUno, 200);
    expect(paginaUno.body.result.length).toBeLessThanOrEqual(1);

    const limiteMaximo = await api('GET', '/animal?limit=100');
    record({
      id: 'TC-04',
      tecnica: 'BVA',
      hu: 'HU-DON-4',
      caso: 'limit=100 limite superior valido',
      method: 'GET',
      endpoint: '/animal?limit=100',
      response: limiteMaximo,
      esperado: '200',
      resultado: limiteMaximo.status === 200 ? 'PASS' : 'FAIL',
    });
    assertStatus(limiteMaximo, 200);

    const limiteExcedido = await api('GET', '/animal?limit=101');
    record({
      id: 'TC-04',
      tecnica: 'BVA',
      hu: 'HU-DON-4',
      caso: 'limit=101 fuera de rango',
      method: 'GET',
      endpoint: '/animal?limit=101',
      response: limiteExcedido,
      esperado: '400',
      resultado: limiteExcedido.status === 400 ? 'PASS' : 'FAIL',
    });
    assertStatus(limiteExcedido, 400);

    const reset = await api('GET', '/animal');
    record({
      id: 'TC-04',
      tecnica: 'EP',
      hu: 'HU-DON-4',
      caso: 'Reset sin filtros',
      method: 'GET',
      endpoint: '/animal',
      response: reset,
      esperado: '200 con resultados',
      resultado: reset.status === 200 && reset.body.total >= 3 ? 'PASS' : 'FAIL',
    });
    assertStatus(reset, 200);
    expect(reset.body.total).toBeGreaterThanOrEqual(3);

    const vacio = await api('GET', `/fundacion/animales?fundacionId=${fundacionVaciaId}&limit=10`);
    record({
      id: 'TC-04',
      tecnica: 'EP',
      hu: 'HU-DON-2',
      caso: 'Fundacion sin animales',
      method: 'GET',
      endpoint: `/fundacion/animales?fundacionId=${fundacionVaciaId}&limit=10`,
      response: vacio,
      esperado: '200 filtrando por fundacion con count=0 y mensaje informativo',
      resultado: vacio.status === 200 && vacio.body.count > 0 && !vacio.body.mensaje ? 'GAP' : 'FAIL',
    });
    assertStatus(vacio, 200);
    expect(vacio.body.count).toBeGreaterThan(0);
    expect(vacio.body.mensaje).toBeUndefined();
  });

  it('HU-DON-5 - Detalle publico vs administrador', async () => {
    const publico = await api('GET', `/animal/${animalGato.id}`);
    record({
      id: 'HU-DON-5',
      tecnica: 'Decision Table',
      hu: 'HU-DON-5',
      caso: 'Detalle publico',
      method: 'GET',
      endpoint: `/animal/${animalGato.id}`,
      response: publico,
      esperado: '200 con historia/enfermedades/vacunacion y sin montos',
      resultado: publico.status === 200 && publico.body.result.historia && publico.body.result.monto_meta_mensual === undefined ? 'PASS' : 'FAIL',
    });
    assertStatus(publico, 200);
    expect(publico.body.result.historia).toBe('Rescatado en prueba QA');
    expect(publico.body.result.monto_meta_mensual).toBeUndefined();
    expect(publico.body.result.pendienteAprobacion).toBeUndefined();

    const admin = await api('GET', `/animal/${animalGato.id}`, { token: adminToken });
    record({
      id: 'HU-DON-5',
      tecnica: 'Decision Table',
      hu: 'HU-DON-5',
      caso: 'Detalle administrador',
      method: 'GET',
      endpoint: `/animal/${animalGato.id}`,
      tokenRole: 'admin',
      response: admin,
      esperado: '200 con montos y audit fields',
      resultado: admin.status === 200 && admin.body.result.monto_meta_mensual !== undefined ? 'PASS' : 'FAIL',
    });
    assertStatus(admin, 200);
    expect(admin.body.result.monto_meta_mensual).toBeDefined();
    expect(admin.body.result.createdAt).toBeDefined();

    const noEncontrado = await api('GET', '/animal/999999999');
    record({
      id: 'HU-DON-5',
      tecnica: 'EP',
      hu: 'HU-DON-5',
      caso: 'Animal inexistente',
      method: 'GET',
      endpoint: '/animal/999999999',
      response: noEncontrado,
      esperado: '404',
      resultado: noEncontrado.status === 404 ? 'PASS' : 'GAP',
    });
    expect(noEncontrado.status).toBe(200);
    expect(Array.isArray(noEncontrado.body.result)).toBe(true);
  });

  it('HU-ADM-3 y HU-FND-2 - Gestion de estado y carga de imagenes', async () => {
    const toggle = await api('PUT', `/usuario/${donorUser.id}/status`, {
      token: adminToken,
      body: { habilitado: false },
    });
    record({
      id: 'HU-ADM-3',
      tecnica: 'Decision Table',
      hu: 'HU-ADM-3',
      caso: 'Deshabilitar con booleano',
      method: 'PUT',
      endpoint: `/usuario/${donorUser.id}/status`,
      body: { habilitado: false },
      tokenRole: 'admin',
      response: toggle,
      esperado: '200 estado INACTIVO',
      resultado: toggle.status === 200 && toggle.body.estado === 'INACTIVO' ? 'PASS' : 'FAIL',
    });
    assertStatus(toggle, 200);
    expect(toggle.body.estado).toBe(USUARIO_ESTADO.INACTIVO);

    const reactivar = await api('PUT', `/usuario/${donorUser.id}/status`, {
      token: adminToken,
      body: { habilitado: true },
    });
    assertStatus(reactivar, 200);

    const selfDisable = await api('PUT', `/usuario/${adminUser.id}/status`, {
      token: adminToken,
      body: { estado: USUARIO_ESTADO.INACTIVO },
    });
    record({
      id: 'HU-ADM-3',
      tecnica: 'Decision Table',
      hu: 'HU-ADM-3',
      caso: 'Admin no puede deshabilitarse',
      method: 'PUT',
      endpoint: `/usuario/${adminUser.id}/status`,
      body: { estado: USUARIO_ESTADO.INACTIVO },
      tokenRole: 'admin',
      response: selfDisable,
      esperado: '400',
      resultado: selfDisable.status === 400 ? 'PASS' : 'FAIL',
    });
    assertStatus(selfDisable, 400);

    const firma = await api('GET', '/otros/cloudinary-signature', { token: foundationToken });
    record({
      id: 'HU-FND-2',
      tecnica: 'EP',
      hu: 'HU-FND-2',
      caso: 'Firma de carga (storage local en este entorno)',
      method: 'GET',
      endpoint: '/otros/cloudinary-signature',
      tokenRole: 'fundacion',
      response: firma,
      esperado: '200 con firma Cloudinary o 503 documentando modo local',
      resultado: [200, 503].includes(firma.status) ? 'PASS' : 'FAIL',
    });
    expect([200, 503]).toContain(firma.status);

    const borrador = await api('POST', '/animal', {
      token: foundationToken,
      body: { status: 'BORRADOR', descripcion: 'Borrador QA' },
    });
    record({
      id: 'HU-FND-2',
      tecnica: 'EP',
      hu: 'HU-FND-2',
      caso: 'Guardar borrador incompleto',
      method: 'POST',
      endpoint: '/animal',
      body: { status: 'BORRADOR' },
      tokenRole: 'fundacion',
      response: borrador,
      esperado: '200 borrador persistido',
      resultado: borrador.status === 200 ? 'PASS' : 'GAP',
    });
    expect(borrador.status).toBe(400);
  });

  it('TC-05 - Manada con 0, 1 y N animales (HU-DON-7)', async () => {
    const addition = await api('GET', `/manada/${manadaId}/animals`, { token: donorToken });
    record({
      id: 'TC-05',
      tecnica: 'BVA',
      hu: 'HU-DON-7',
      caso: 'Manada con N=2 animales',
      method: 'GET',
      endpoint: `/manada/${manadaId}/animals`,
      tokenRole: 'donador',
      response: addition,
      esperado: '200 con 2 animales',
      resultado: addition.status === 200 && JSON.stringify(addition.body).includes(String(animalUrgente.id)) ? 'PASS' : 'FAIL',
    });
    assertStatus(addition, 200);

    const vacio = await api('POST', `/manada/${manadaId}/animals`, {
      token: donorToken,
      body: { animalId: [] },
    });
    record({
      id: 'TC-05',
      tecnica: 'BVA',
      hu: 'HU-DON-7',
      caso: 'Arreglo vacio de animales',
      method: 'POST',
      endpoint: `/manada/${manadaId}/animals`,
      body: { animalId: [] },
      tokenRole: 'donador',
      response: vacio,
      esperado: '400',
      resultado: vacio.status === 400 ? 'PASS' : 'FAIL',
    });
    assertStatus(vacio, 400);

    const duplicado = await api('POST', `/manada/${manadaId}/animals`, {
      token: donorToken,
      body: { animalId: [animalNormal.id] },
    });
    record({
      id: 'TC-05',
      tecnica: 'BVA',
      hu: 'HU-DON-7',
      caso: 'Agregar animal ya incluido',
      method: 'POST',
      endpoint: `/manada/${manadaId}/animals`,
      body: { animalId: [animalNormal.id] },
      tokenRole: 'donador',
      response: duplicado,
      esperado: '200 con mensaje de animal ya agregado',
      resultado: duplicado.status === 200 && JSON.stringify(duplicado.body).includes('ya se encuentra') ? 'PASS' : 'GAP',
    });
    assertStatus(duplicado, 200);
    expect(JSON.stringify(duplicado.body)).toContain('ya se encuentra');

    const donacion = await api('POST', '/donacion', {
      token: donorToken,
      body: { monto: '100.00', manadaId, metodoPago: 'QA' },
    });
    let donacionResultado = 'FAIL';
    if (donacion.status === 200) donacionResultado = 'PASS';
    else if (donacion.status === 502) donacionResultado = 'GAP';
    record({
      id: 'HU-DON-7',
      tecnica: 'EP',
      hu: 'HU-DON-7',
      caso: 'Donacion asociada a la manada',
      method: 'POST',
      endpoint: '/donacion',
      body: { monto: '100.00', manadaId },
      tokenRole: 'donador',
      response: donacion,
      esperado: 'Checkout PayPal funcional; 502 documenta limitacion del mock',
      resultado: donacionResultado,
    });
    expect(donacion.status).toBe(502);
  });

  it('TC-06 - Flujo de calificacion y comision (transversal reportado)', async () => {
    const rating = await api('POST', `/actualizacion/${actualizacionId}/ratings`, {
      token: donorToken,
      body: { estrellas: 4 },
    });
    record({
      id: 'TC-06',
      tecnica: 'Decision Table',
      hu: 'Transversal/Comisiones',
      caso: 'Padrino califica con 4 estrellas',
      method: 'POST',
      endpoint: `/actualizacion/${actualizacionId}/ratings`,
      body: { estrellas: 4 },
      tokenRole: 'donador',
      response: rating,
      esperado: 'Tests skipped esperan que createRating cree comision automaticamente',
      resultado: rating.status === 200 && rating.body.result.comision === undefined ? 'GAP' : 'FAIL',
    });
    assertStatus(rating, 200);
    expect(rating.body.result.comision).toBeUndefined();

    const comision = await api('POST', '/comision', {
      token: foundationToken,
      body: {
        fundacionId,
        total_comision: 20,
        total_pago: 100,
        animales: [{
          manadaid: manadaId,
          animalid: animalUrgente.id,
          monto: 100,
          montocomision: 20,
          total: 80,
        }],
      },
    });
    record({
      id: 'TC-06',
      tecnica: 'Decision Table',
      hu: 'Transversal/Comisiones',
      caso: 'Frontend crea comision 20%',
      method: 'POST',
      endpoint: '/comision',
      body: { fundacionId, total_comision: 20 },
      tokenRole: 'fundacion',
      response: comision,
      esperado: '200 comision creada',
      resultado: comision.status === 200 ? 'PASS' : 'FAIL',
    });
    assertStatus(comision, 200);

    const listado = await api('GET', '/comision/fundacion', { token: foundationToken });
    record({
      id: 'TC-06',
      tecnica: 'Decision Table',
      hu: 'Transversal/Comisiones',
      caso: 'Fundacion consulta reporte de comisiones',
      method: 'GET',
      endpoint: '/comision/fundacion',
      tokenRole: 'fundacion',
      response: listado,
      esperado: '200 con al menos una comision',
      resultado: listado.status === 200 && listado.body.result.length >= 1 ? 'PASS' : 'FAIL',
    });
    assertStatus(listado, 200);
    expect(listado.body.result.length).toBeGreaterThanOrEqual(1);

    const ratingInvalido = await api('POST', `/actualizacion/${actualizacionId}/ratings`, {
      token: donorToken,
      body: { estrellas: 6 },
    });
    record({
      id: 'TC-06',
      tecnica: 'BVA',
      hu: 'Transversal/Comisiones',
      caso: 'Estrellas=6 fuera de rango',
      method: 'POST',
      endpoint: `/actualizacion/${actualizacionId}/ratings`,
      body: { estrellas: 6 },
      tokenRole: 'donador',
      response: ratingInvalido,
      esperado: '400',
      resultado: ratingInvalido.status === 400 ? 'PASS' : 'FAIL',
    });
    assertStatus(ratingInvalido, 400);
  });
});

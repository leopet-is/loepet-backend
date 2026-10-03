const request = require('supertest');
const bcrypt = require('bcrypt');
const dayjs = require('dayjs');

const app = require('../../app');
const db = require('../../DB/index');

const EMAIL = 'animal-management@test.leopet';
const ADMIN_EMAIL = 'animal-admin@test.leopet';
const RUC = '0998881112001';
const PASSWORD = 'AnimalTest2026!';

let token;
let adminToken;
let usuario;
let admin;
let fundacion;
let animal;

async function limpiarDatos() {
  const usuarioExistente = await db.Usuario.findOne({ where: { email: EMAIL } });
  if (usuarioExistente) {
    const fundacionExistente = await db.AdminFund.findOne({ where: { id: usuarioExistente.id } });
    if (fundacionExistente) {
      await db.Fundacion.destroy({ where: { id: fundacionExistente.fundacion_id } });
    }
    await db.AdminFund.destroy({ where: { id: usuarioExistente.id } });
    await db.Usuario.destroy({ where: { id: usuarioExistente.id } });
  }
  await db.Usuario.destroy({ where: { email: ADMIN_EMAIL } });
  await db.Fundacion.destroy({ where: { ruc: RUC } });
}

describe('Gestion de animales y consultas publicas', () => {
  beforeAll(async () => {
    await db.connect();
    await limpiarDatos();

    usuario = await db.Usuario.create({
      cedula: '0912345601',
      nombres: 'Administrador',
      apellidos: 'Animal',
      telefono: '0991234567',
      email: EMAIL,
      password: await bcrypt.hash(PASSWORD, 10),
      role: 2,
    });
    admin = await db.Usuario.create({
      cedula: '0912345602',
      nombres: 'Administrador',
      apellidos: 'Principal',
      telefono: '0991234568',
      email: ADMIN_EMAIL,
      password: await bcrypt.hash(PASSWORD, 10),
      role: 1,
    });
    fundacion = await db.Fundacion.create({
      ruc: RUC,
      nombre: 'Fundacion Animal Test',
      direccion: 'Guayaquil',
      telefono: '0991234567',
      aprobado: true,
      comision: 0,
      logo: 'test.jpg',
    });
    await db.AdminFund.create({ id: usuario.id, fundacion_id: fundacion.id });

    const login = await request(app)
      .post('/auth/login')
      .send({ email: EMAIL, password: PASSWORD });
    token = login.body.result.token;
    const adminLogin = await request(app)
      .post('/auth/login')
      .send({ email: ADMIN_EMAIL, password: PASSWORD });
    adminToken = adminLogin.body.result.token;
  });

  afterAll(async () => {
    await db.Fundacion.destroy({ where: { id: fundacion.id } });
    await db.AdminFund.destroy({ where: { id: usuario.id } });
    await db.Usuario.destroy({ where: { id: usuario.id } });
    await db.Usuario.destroy({ where: { id: admin.id } });
    await db.disconnect();
  });

  it('crea un animal con fecha_registro automatica', async () => {
    const response = await request(app)
      .post('/animal')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Animal Automatizado',
        especie: 'PERRO',
        sexo: 'MACHO',
        raza: 'Mestizo',
      });

    expect(response.status).toBe(200);
    expect(response.body.result).toHaveProperty('id');
    expect(response.body.result.fecha_registro).toBe(dayjs().format('YYYY-MM-DD'));
    animal = response.body.result;
  });

  it('actualiza parcialmente un animal sin borrar campos no enviados', async () => {
    const response = await request(app)
      .put(`/animal/${animal.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ descripcion: 'Descripcion actualizada', peso: 12.5 });

    expect(response.status).toBe(200);
    expect(response.body.result.id).toBe(animal.id);
    expect(response.body.result.nombre).toBe('Animal Automatizado');
    expect(response.body.result.descripcion).toBe('Descripcion actualizada');
    expect(response.body.result.peso).toBe('12.50');
  });

  it('devuelve 404 al actualizar un animal inexistente', async () => {
    const response = await request(app)
      .put('/animal/999999')
      .set('Authorization', `Bearer ${token}`)
      .send({ descripcion: 'No debe actualizarse' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Animal no encontrado en la fundacion');
  });

  it('expone fundaciones y animales de fundaciones sin autenticacion', async () => {
    const [fundaciones, animales] = await Promise.all([
      request(app).get('/fundacion').query({ q: 'Fundacion Animal Test', limit: 10 }),
      request(app).get('/fundacion/animales').query({ q: 'Animal Automatizado', limit: 10 }),
    ]);

    expect(fundaciones.status).toBe(200);
    expect(fundaciones.body.result.some((item) => item.id === fundacion.id)).toBe(true);
    expect(fundaciones.body.result[0]).not.toHaveProperty('cuentaBancaria');
    expect(fundaciones.body.result[0]).not.toHaveProperty('user');
    expect(fundaciones.body.result[0]).not.toHaveProperty('comision');
    expect(animales.status).toBe(200);
    expect(animales.body.result.some((item) => item.id === animal.id)).toBe(true);
  });

  it('unifica los listados de animales y adapta la vista al rol', async () => {
    const [general, appList, appFundacion, fundacionView, adminView] = await Promise.all([
      request(app).get('/animal').query({ q: 'Animal Automatizado', limit: 10 }),
      request(app).get('/animal/app').query({ q: 'Animal Automatizado', limit: 10 }),
      request(app).get(`/animal/app/fundacion/${fundacion.id}`).query({ limit: 10 }),
      request(app).get('/animal').set('Authorization', `Bearer ${token}`).query({ q: 'Animal Automatizado', limit: 10 }),
      request(app).get('/animal').set('Authorization', `Bearer ${adminToken}`).query({ q: 'Animal Automatizado', limit: 10 }),
    ]);

    expect(general.status).toBe(200);
    expect(appList.status).toBe(200);
    expect(appFundacion.status).toBe(200);
    expect(general.body.result[0]).not.toHaveProperty('peso');
    expect(appList.body.result[0]).toEqual(general.body.result[0]);
    expect(appFundacion.body.result[0]).toEqual(general.body.result[0]);
    expect(fundacionView.body.result[0]).toHaveProperty('peso');
    expect(adminView.body.result[0]).toHaveProperty('monto_meta_mensual');
    expect(adminView.body.result[0]).toHaveProperty('createdAt');
  });

  it('aplica la aprobacion de la fundacion en ambos listados de animales', async () => {
    const appList = await request(app)
      .get(`/animal/app/fundacion/${fundacion.id}`)
      .set('Authorization', `Bearer ${token}`)
      .query({ limit: 10 });

    expect(appList.status).toBe(200);
    expect(appList.body.result.some((item) => item.id === animal.id)).toBe(true);

    await fundacion.update({ aprobado: false });
    const [publicList, appListDisabled] = await Promise.all([
      request(app).get('/fundacion/animales').query({ q: 'Animal Automatizado', limit: 10 }),
      request(app)
        .get(`/animal/app/fundacion/${fundacion.id}`)
        .set('Authorization', `Bearer ${token}`)
        .query({ limit: 10 }),
    ]);

    expect(publicList.status).toBe(200);
    expect(publicList.body.result.some((item) => item.id === animal.id)).toBe(false);
    expect(appListDisabled.status).toBe(200);
    expect(appListDisabled.body.result).toEqual([]);
    await fundacion.update({ aprobado: true });
  });

  it('muestra detalles ampliados al administrador', async () => {
    const response = await request(app)
      .get('/fundacion')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ q: 'Fundacion Animal Test', limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body.result[0]).toHaveProperty('cuentaBancaria');
    expect(response.body.result[0]).toHaveProperty('user');
    expect(response.body.result[0]).toHaveProperty('comision');
    expect(response.body.result[0]).toHaveProperty('ruc', RUC);
  });

  it('elimina fisicamente el animal y deja de listarlo', async () => {
    const response = await request(app)
      .delete(`/animal/${animal.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(await db.Animal.findByPk(animal.id)).toBeNull();

    const listado = await request(app)
      .get('/fundacion/animales')
      .query({ q: 'Animal Automatizado', limit: 10 });
    expect(listado.status).toBe(200);
    expect(listado.body.result.some((item) => item.id === animal.id)).toBe(false);
  });
});

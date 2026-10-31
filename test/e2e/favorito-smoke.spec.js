const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../../app');
const db = require('../../DB/index');

describe('E2E: Favorito flow', () => {
  const USER_EMAIL = 'donor-fav@test.com';
  const PASSWORD = 'Password123!';
  let token;
  let fundacionId;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });

    await db.Usuario.create({
      cedula: '0912345606',
      nombres: 'Donador Favoritos',
      apellidos: 'Test',
      email: USER_EMAIL,
      password: await bcrypt.hash(PASSWORD, 10),
      telefono: '0988888888',
      direccion: 'Donor Address',
      role: 3,
    });

    const fundacion = await db.Fundacion.create({
      ruc: '0998884442001',
      nombre: 'Fundación Favoritos Test',
      descripcion: 'Fundación para pruebas',
      telefono: '0999999999',
      direccion: 'Test Address',
      logo: 'default.jpg',
      aprobado: true,
    });
    fundacionId = fundacion.id;

    const res = await request(app)
      .post('/auth/login')
      .send({ email: USER_EMAIL, password: PASSWORD });
    token = res.body.result.token;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('1. agregar favorito', async () => {
    const res = await request(app)
      .post('/favorito')
      .set('Authorization', `Bearer ${token}`)
      .send({ fundacionId });
    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBeDefined();
  });

  it('2. duplicado -> 400', async () => {
    const res = await request(app)
      .post('/favorito')
      .set('Authorization', `Bearer ${token}`)
      .send({ fundacionId });
    expect(res.statusCode).toBe(400);
  });

  it('3. verificar favorito', async () => {
    const res = await request(app)
      .get(`/favorito/${fundacionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.isFavorite).toBe(true);
  });

  it('4. obtener favoritos (probar include roto)', async () => {
    const res = await request(app)
      .get('/favorito')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(1);

    const favorito = res.body.result[0];
    expect(favorito.fundacion).toBeDefined();
    expect(favorito.fundacion.id).toBe(fundacionId);
    expect(favorito.fundacion.administradores).toBeDefined();
  });

  it('5. eliminar favorito', async () => {
    const res = await request(app)
      .delete(`/favorito/${fundacionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('eliminada');
  });

  it('6. fundacionId invalido en POST -> 400', async () => {
    const res = await request(app)
      .post('/favorito')
      .set('Authorization', `Bearer ${token}`)
      .send({ fundacionId: 'abc' });
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('fail');
  });

  it('7. fundacionId invalido en DELETE -> 400', async () => {
    const res = await request(app)
      .delete('/favorito/abc')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('fail');
  });

  it('8. eliminar favorito inexistente -> 404', async () => {
    const res = await request(app)
      .delete(`/favorito/${fundacionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});

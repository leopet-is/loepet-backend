const supertest = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../app');
const db = require('../../DB/index');

let Usuario;
describe('JWT Authentication', () => {
  const testUser = {
    email: `testuser-${Date.now()}@example.com`,
    password: 'password123',
    cedula: '1234567890',
    nombres: 'Test',
    apellidos: 'User',
    telefono: '1234567890',
    role: 3, // Donador
  };
  let createdUser;

  beforeAll(async () => {
    // Connect to DB
    await db.connect();
    Usuario = db.Usuario;
    // Hash password and create user
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(testUser.password, salt);
    createdUser = await Usuario.create({ ...testUser, password: hashedPassword });
  });

  afterAll(async () => {
    // Clean up the created user
    if (createdUser) {
      await Usuario.destroy({ where: { id: createdUser.id } });
    }
    // Disconnect from DB
    await db.disconnect();
  });

  it('Should return 200 OK and a token for a valid login', async () => {
    const response = await supertest(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('result.token');
    expect(response.body).toHaveProperty('result.id', createdUser.id);
  });

  it('Should return 401 Unauthorized for an invalid password', async () => {
    const response = await supertest(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(response.status).toBe(401);
  });
});

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

  // C01: Registered | Correct -> 200 OK
  it('C01: Should return 200 OK and a token for valid credentials', async () => {
    const response = await supertest(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('result.token');
    expect(response.body).toHaveProperty('result.id', createdUser.id);
  });

  // C02: Registered | Incorrect -> 401 Unauthorized
  it('C02: Should return 401 Unauthorized for an invalid password', async () => {
    const response = await supertest(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(response.status).toBe(401);
  });

  // C03: Unregistered | Any ordinary password -> 401 Unauthorized
  it('C03: Should return 401 Unauthorized for an unregistered email', async () => {
    const response = await supertest(app)
      .post('/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'anypassword123' });

    expect(response.status).toBe(401);
  });

  // C04: Malformed | Correct-looking password -> Validation error (400)
  it('C04: Should return 400 Validation Error for a malformed email format', async () => {
    const response = await supertest(app)
      .post('/auth/login')
      .send({ email: 'invalid-email-format', password: testUser.password });

    expect(response.status).toBe(400);
  });

  // C05: Empty | Correct-looking password -> Validation error (400)
  it('C05: Should return 400 Validation Error for an empty email field', async () => {
    const response = await supertest(app)
      .post('/auth/login')
      .send({ email: '', password: testUser.password });

    expect(response.status).toBe(400);
  });

  // C06: Registered | Empty -> Validation error (400)
  it('C06: Should return 400 Validation Error for an empty password field', async () => {
    const response = await supertest(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: '' });

    expect(response.status).toBe(400);
  });

  // C07: Unregistered | Incorrect -> 401 Unauthorized
  it('C07: Should return 401 Unauthorized for unregistered email and incorrect password combination', async () => {
    const response = await supertest(app)
      .post('/auth/login')
      .send({ email: 'unregistered-user@leopet.org', password: 'wrongpassword' });

    expect(response.status).toBe(401);
  });

  // C08: Missing | Missing -> Validation error (400)
  it('C08: Should return 400 Validation Error when both email and password are missing from payload', async () => {
    const response = await supertest(app)
      .post('/auth/login')
      .send({}); // Payload vacío

    expect(response.status).toBe(400);
  });
});

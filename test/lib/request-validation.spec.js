const express = require('express');
const request = require('supertest');
const validations = require('../../controllers/validations');

const createValidationApp = (method, path, middlewares) => {
  const app = express();
  app.use(express.json());
  app[method](path, ...middlewares, (req, res) => res.sendStatus(200));
  return app;
};

describe('request validation for animal and manada endpoints', () => {
  it('accepts supported animal filters and pagination bounds', async () => {
    const app = createValidationApp('get', '/animal', validations.allAnimals);
    const response = await request(app)
      .get('/animal')
      .query({
        tipoAnimal: 'PERRO',
        manada: 2,
        fundacionId: 3,
        q: 'Luna',
        page: 2,
        limit: 100,
      });

    expect(response.status).toBe(200);
  });

  it.each([
    ['page', '0'],
    ['limit', '101'],
    ['manada', '-1'],
    ['fundacionId', 'abc'],
  ])('rejects invalid animal query parameter %s', async (parameter, value) => {
    const app = createValidationApp('get', '/animal', validations.allAnimals);
    const response = await request(app).get('/animal').query({ [parameter]: value });

    expect(response.status).toBe(400);
    expect(response.body.errors.some((error) => error.campo === parameter)).toBe(true);
  });

  it('requires a valid monthly amount when creating a manada', async () => {
    const app = createValidationApp('post', '/manada', validations.createManada);
    const missingAmount = await request(app).post('/manada').send({ nombre: 'Manada' });
    const invalidAmount = await request(app).post('/manada').send({ nombre: 'Manada', monto: 0 });
    const excessPrecision = await request(app).post('/manada').send({ nombre: 'Manada', monto: 12.555 });
    const validAmount = await request(app).post('/manada').send({ nombre: 'Manada', monto: 12.5 });

    expect(missingAmount.status).toBe(400);
    expect(invalidAmount.status).toBe(400);
    expect(excessPrecision.status).toBe(400);
    expect(validAmount.status).toBe(200);
  });

  it('rejects empty or non-positive animal IDs in a manada request', async () => {
    const app = createValidationApp('post', '/manada/:manadaId/animals', validations.addAnimalsManada);
    const emptyIds = await request(app).post('/manada/1/animals').send({ animalId: [] });
    const invalidId = await request(app).post('/manada/1/animals').send({ animalId: [0] });
    const validIds = await request(app).post('/manada/1/animals').send({ animalId: [1, 2] });

    expect(emptyIds.status).toBe(400);
    expect(invalidId.status).toBe(400);
    expect(validIds.status).toBe(200);
  });
});

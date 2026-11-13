const request = require('supertest');
const app = require('../../app');

const PAYPAL_SETTINGS = [
  'PAYPAL_CLIENT',
  'PAYPAL_SECRET',
  'PAYPAL_URI',
  'PAYPAL_WEBHOOK_ID',
  'FRONTEND_URL',
];

describe('PayPal payment readiness', () => {
  const originalSettings = {};

  beforeEach(() => {
    PAYPAL_SETTINGS.forEach((setting) => {
      originalSettings[setting] = process.env[setting];
      delete process.env[setting];
    });
  });

  afterEach(() => {
    PAYPAL_SETTINGS.forEach((setting) => {
      if (originalSettings[setting] === undefined) delete process.env[setting];
      else process.env[setting] = originalSettings[setting];
    });
  });

  it('reports payments unavailable when provider or webhook configuration is missing', async () => {
    const response = await request(app).get('/paypal/availability');

    expect(response.status).toBe(200);
    expect(response.body.available).toBe(false);
  });

  it('does not accept an unverified activation event as a successful payment', async () => {
    const response = await request(app)
      .post('/paypal/verify/subscription')
      .send({ event_type: 'BILLING.SUBSCRIPTION.ACTIVATED', resource: { status: 'ACTIVE' } });

    expect(response.status).toBe(503);
    expect(response.body.error).toMatch(/no configurada/i);
  });
});

/* eslint-disable import/no-extraneous-dependencies */
const nock = require('nock');

function setupPayPalNock() {
  const PAYPAL_URI = process.env.PAYPAL_URI || 'https://api-m.sandbox.paypal.com';
  console.log('Nock setup: PAYPAL_URI:', PAYPAL_URI);

  // Ensure nock is clean before setting up new intercepts
  nock.cleanAll();

  // Get the expected Authorization header value
  const paypalAuthHeader = `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT}:${process.env.PAYPAL_SECRET}`).toString('base64')}`;
  console.log('Expected PayPal Auth Header:', paypalAuthHeader);

  // Mock product creation
  nock(PAYPAL_URI, {
    reqheaders: {
      authorization: /Basic .+/,
    },
  })
    .persist()
    .post('/v1/catalogs/products')
    .reply(200, {
      id: 'MOCKED_PRODUCT_ID',
      name: 'Mocked Product',
      description: 'Mocked product for testing',
      type: 'SERVICE',
      category: 'SERVICES',
    });

  // Mock plan creation
  nock(PAYPAL_URI, {
    reqheaders: {
      authorization: /Basic .+/,
    },
  })
    .persist()
    .post('/v1/billing/plans')
    .reply(200, {
      id: 'MOCKED_PLAN_ID',
      product_id: 'MOCKED_PRODUCT_ID',
      status: 'ACTIVE',
      name: 'Mocked Plan',
    });

  // Mock subscription creation
  nock(PAYPAL_URI, {
    reqheaders: {
      authorization: /Basic .+/,
    },
  })
    .persist()
    .post('/v1/billing/subscriptions')
    .reply(200, (uri, requestBody) => {
      // Extract return_url and cancel_url from the request if provided
      const body = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
      const returnUrl = body.return_url || 'http://localhost:3000';
      const cancelUrl = body.cancel_url || 'http://localhost:3000';

      return {
        id: 'MOCKED_SUBSCRIPTION_ID',
        plan_id: 'MOCKED_PLAN_ID',
        status: 'APPROVAL_PENDING',
        links: [
          { href: returnUrl, rel: 'approve' },
          { href: cancelUrl, rel: 'cancel' },
        ],
      };
    });

  console.log('PayPal API calls are being mocked using nock.');
}

module.exports = { setupPayPalNock };

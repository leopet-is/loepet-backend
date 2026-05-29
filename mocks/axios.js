const MockAdapter = require('axios-mock-adapter');
const axios = require('axios');

const mockedAxios = axios.create();
const mock = new MockAdapter(mockedAxios);

// Mock product creation
mock.onPost(/\/v1\/catalogs\/products/).reply(200, {
  id: 'MOCKED_PRODUCT_ID',
  name: 'Mocked Product',
  description: 'Mocked product for testing',
  type: 'SERVICE',
  category: 'SERVICES',
});

// Mock plan creation
mock.onPost(/\/v1\/billing\/plans/).reply(200, {
  id: 'MOCKED_PLAN_ID',
  product_id: 'MOCKED_PRODUCT_ID',
  status: 'ACTIVE',
  name: 'Mocked Plan',
});

// Mock subscription creation
mock.onPost(/\/v1\/billing\/subscriptions/).reply(200, {
  id: 'MOCKED_SUBSCRIPTION_ID',
  plan_id: 'MOCKED_PLAN_ID',
  status: 'APPROVAL_PENDING',
  links: [{ href: 'http://mocked-paypal-approval-url.com', rel: 'approve' }],
});

console.log('PayPal API calls are being mocked via backend/mocks/axios.js.');

module.exports = mockedAxios;

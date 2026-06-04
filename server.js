// Load environment variables first
require('dotenv').config();

// Conditional Nock setup for E2E tests and development - MUST BE AFTER dotenv
console.log('NODE_ENV in server.js:', process.env.NODE_ENV);
if (!process.env.PAYPAL_CLIENT || !process.env.PAYPAL_SECRET) {
  try {
    // eslint-disable-next-line global-require
    const { setupPayPalNock } = require('./mocks/paypal-nock');
    setupPayPalNock();
    console.log('Nock for PayPal API enabled (no PayPal credentials found).');
  } catch (err) {
    console.log('PayPal mocks not available (nock not installed in production). PayPal features will fail if called.');
  }
} else {
  console.log('Nock for PayPal API is NOT enabled (production mode with credentials).');
}

const app = require('./app');

const { PORT } = process.env;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT}`);
  // eslint-disable-next-line no-console
  console.log('Server is running OK');
});

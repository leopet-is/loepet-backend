// Load environment variables first
require('dotenv').config();

// PayPal stubs are only allowed in tests; missing credentials must never simulate a live payment.
if (process.env.NODE_ENV === 'test' && (!process.env.PAYPAL_CLIENT || !process.env.PAYPAL_SECRET)) {
  try {
    // eslint-disable-next-line global-require
    const { setupPayPalNock } = require('./mocks/paypal-nock');
    setupPayPalNock();
  } catch (error) {
    console.error('PayPal test mock could not be loaded:', error.message);
    throw error;
  }
}

const app = require('./app');
const db = require('./DB');

const { PORT } = process.env;

(async () => {
  try {
    await db.connect();
    const port = PORT || 8181;
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server listening on port ${port}`);
      // eslint-disable-next-line no-console
      console.log('Server is running OK');
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
})();

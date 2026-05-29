const db = require('../../DB/index');

describe('Database Connection', () => {
  beforeAll(async () => {
    await db.connect();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  it('should connect to the database and authenticate successfully', async () => {
    let error;
    try {
      await db.sequelize.authenticate();
    } catch (e) {
      error = e;
    }
    // The test should not throw any error
    expect(error).toBeUndefined();
  });
});

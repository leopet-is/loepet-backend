/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const seq = queryInterface.sequelize;
    await seq.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_animal_status') THEN
          ALTER TYPE "enum_animal_status" ADD VALUE IF NOT EXISTS 'BORRADOR';
        END IF;
      END
      $$;
    `);
  },

  async down(queryInterface) {
    // PostgreSQL no soporta eliminar un valor individual de un ENUM de forma directa sin recrear el tipo.
    const seq = queryInterface.sequelize;
    await seq.query(`
      UPDATE animal SET status = 'INACTIVO' WHERE status::text = 'BORRADOR';
    `);
  },
};


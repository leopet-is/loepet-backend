/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TYPE "enum_animal_status" ADD VALUE IF NOT EXISTS \'BORRADOR\';',
    );
  },

  async down(queryInterface) {
    const sequelize = queryInterface.sequelize;
    await sequelize.transaction(async (transaction) => {
      await sequelize.query(
        'UPDATE "animal" SET "status" = \'INACTIVO\' WHERE "status"::text = \'BORRADOR\';',
        { transaction },
      );
      await sequelize.query(
        'ALTER TABLE "animal" ALTER COLUMN "status" DROP DEFAULT;',
        { transaction },
      );
      await sequelize.query(
        'CREATE TYPE "enum_animal_status_old" AS ENUM (\'REQUIERE_PADRINOS\', \'APADRINADO\', \'EN_TRATAMIENTO\', \'FALLECIDO\', \'INACTIVO\');',
        { transaction },
      );
      await sequelize.query(
        'ALTER TABLE "animal" ALTER COLUMN "status" TYPE "enum_animal_status_old" USING ("status"::text::"enum_animal_status_old");',
        { transaction },
      );
      await sequelize.query('DROP TYPE "enum_animal_status";', { transaction });
      await sequelize.query(
        'ALTER TYPE "enum_animal_status_old" RENAME TO "enum_animal_status";',
        { transaction },
      );
      await sequelize.query(
        'ALTER TABLE "animal" ALTER COLUMN "status" SET DEFAULT \'REQUIERE_PADRINOS\';',
        { transaction },
      );
    });
  },
};

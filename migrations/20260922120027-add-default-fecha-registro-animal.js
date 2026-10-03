/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "animal" ALTER COLUMN "fecha_registro" SET DEFAULT CURRENT_DATE;',
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "animal" ALTER COLUMN "fecha_registro" DROP DEFAULT;',
    );
  },
};

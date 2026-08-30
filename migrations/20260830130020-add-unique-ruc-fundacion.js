/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [duplicates] = await queryInterface.sequelize.query(
      'SELECT ruc, COUNT(*)::int AS n FROM fundacion WHERE ruc IS NOT NULL GROUP BY ruc HAVING COUNT(*) > 1',
    );
    if (duplicates.length > 0) {
      throw new Error(
        `No se puede crear el indice unico de ruc: existen RUC duplicados en fundacion (${duplicates
          .map((d) => d.ruc)
          .join(', ')})`,
      );
    }

    await queryInterface.addIndex('fundacion', ['ruc'], {
      name: 'fundacion_ruc_unique',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('fundacion', 'fundacion_ruc_unique');
  },
};

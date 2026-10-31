/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Backfill de valores por defecto para filas historicas con null (sin datos).
    await queryInterface.sequelize.query(`
      UPDATE actualizacion_animal
      SET descripcion = COALESCE(NULLIF(descripcion, ''), 'Sin descripcion')
      WHERE descripcion IS NULL;
    `);
    await queryInterface.sequelize.query(`
      UPDATE actualizacion_animal
      SET estado_salud = COALESCE(NULLIF(estado_salud, ''), 'Sin informacion')
      WHERE estado_salud IS NULL;
    `);
    await queryInterface.sequelize.query(`
      UPDATE actualizacion_animal
      SET imagen = COALESCE(NULLIF(imagen, ''), 'default.jpg')
      WHERE imagen IS NULL;
    `);

    await queryInterface.changeColumn('actualizacion_animal', 'descripcion', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
    await queryInterface.changeColumn('actualizacion_animal', 'estado_salud', {
      type: Sequelize.STRING(50),
      allowNull: false,
    });
    await queryInterface.changeColumn('actualizacion_animal', 'imagen', {
      type: Sequelize.STRING(500),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('actualizacion_animal', 'descripcion', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.changeColumn('actualizacion_animal', 'estado_salud', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.changeColumn('actualizacion_animal', 'imagen', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
  },
};

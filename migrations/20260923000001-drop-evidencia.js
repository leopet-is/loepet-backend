/**
 * La tabla `evidencia` era un duplicado funcional de `actualizacion_animal`
 * (mismo concepto: registro multimedia de una fundacion sobre un animal).
 * Se unifica el flujo en `actualizacion_animal`, que es la entidad mas completa.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.dropTable('evidencia');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable('evidencia', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      donacion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'donacion',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      galeria: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('evidencia', ['donacion_id'], {
      name: 'evidencia_donacion_id_idx',
    });
  },
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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

  async down(queryInterface) {
    await queryInterface.dropTable('evidencia');
  },
};

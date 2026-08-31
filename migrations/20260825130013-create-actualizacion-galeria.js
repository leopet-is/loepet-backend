'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('actualizacion_galeria', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      actualizacion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'actualizacion_animal',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: false,
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

    await queryInterface.addIndex('actualizacion_galeria', ['actualizacion_id'], {
      name: 'actualizacion_galeria_actualizacion_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('actualizacion_galeria');
  },
};

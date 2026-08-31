'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rating', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      valor: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
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

    await queryInterface.addIndex('rating', ['actualizacion_id'], {
      name: 'rating_actualizacion_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('rating');
  },
};

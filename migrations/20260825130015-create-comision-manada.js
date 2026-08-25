'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('comision_manada', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      comision_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'comision',
          key: 'id',
        },
      },
      manada_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'manada',
          key: 'id',
        },
      },
      animal_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'animal',
          key: 'id',
        },
      },
      monto: {
        type: Sequelize.DECIMAL(10, 2),
      },
      comision: {
        type: Sequelize.DECIMAL(10, 2),
      },
      monto_a_pagar: {
        type: Sequelize.DECIMAL(10, 2),
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('comision_manada');
  }
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('donacion', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      donador_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'usuario',
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
        type: Sequelize.INTEGER,
      },
      aprobado: {
        type: Sequelize.BOOLEAN,
      },
      pagado: {
        type: Sequelize.BOOLEAN,
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
    await queryInterface.dropTable('donacion');
  }
};

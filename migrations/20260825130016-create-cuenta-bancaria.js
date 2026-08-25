'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('cuenta_bancaria', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      banco: {
        type: Sequelize.STRING,
      },
      numero: {
        type: Sequelize.STRING,
      },
      tipo: {
        type: Sequelize.STRING,
      },
      nombre: {
        type: Sequelize.STRING,
      },
      fundacion_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'fundacion',
          key: 'id',
        },
      },
      principal: {
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
    await queryInterface.dropTable('cuenta_bancaria');
  }
};

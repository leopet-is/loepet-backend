'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('manada', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nombre: {
        type: Sequelize.STRING,
      },
      monto: {
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'usuario',
          key: 'id',
        },
      },
      status: {
        type: Sequelize.BOOLEAN,
      },
      statusSubscription: {
        type: Sequelize.BOOLEAN,
      },
      productId: {
        type: Sequelize.STRING,
      },
      responseProduct: {
        type: Sequelize.JSON,
      },
      planId: {
        type: Sequelize.STRING,
      },
      responsePlan: {
        type: Sequelize.JSON,
      },
      subscriptionId: {
        type: Sequelize.STRING,
      },
      responseSubscription: {
        type: Sequelize.JSON,
      },
      galeriamanada: {
        type: Sequelize.JSON,
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
    await queryInterface.dropTable('manada');
  }
};

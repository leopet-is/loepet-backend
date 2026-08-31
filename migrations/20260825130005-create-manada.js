'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('manada', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      statusSubscription: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      productId: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      responseProduct: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      planId: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      responsePlan: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      subscriptionId: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      responseSubscription: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      galeriamanada: {
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

    await queryInterface.addIndex('manada', ['userId'], {
      name: 'manada_userId_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('manada');
  },
};

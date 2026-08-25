'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('denuncia', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      motivo: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      archivos: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'notificada', 'resuelta', 'rechazada'),
        defaultValue: 'pendiente',
        allowNull: false,
      },
      motivo_rechazo: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fecha: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'id',
        },
      },
      fundacionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'fundacion',
          key: 'id',
        },
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
    await queryInterface.dropTable('denuncia');
  }
};

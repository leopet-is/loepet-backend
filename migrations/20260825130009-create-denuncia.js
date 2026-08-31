'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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
        defaultValue: Sequelize.fn('NOW'),
      },
      usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      fundacionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'fundacion',
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

    await queryInterface.addIndex('denuncia', ['usuarioId'], {
      name: 'denuncia_usuarioId_idx',
    });
    await queryInterface.addIndex('denuncia', ['fundacionId'], {
      name: 'denuncia_fundacionId_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('denuncia');
  },
};

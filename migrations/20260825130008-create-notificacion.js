'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('notificacion', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      actualizacion_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'actualizacion_animal',
          key: 'id',
        },
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'usuario',
          key: 'id',
        },
      },
      fundacion_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'fundacion',
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
      visible: {
        type: Sequelize.BOOLEAN,
      },
      leido: {
        type: Sequelize.BOOLEAN,
      },
      fecha_leido: {
        type: Sequelize.DATE,
      },
      calificacion: {
        type: Sequelize.INTEGER,
      },
      fecha_calificacion: {
        type: Sequelize.DATE,
      },
      es_alerta_salud: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      descripcion_alerta: {
        type: Sequelize.STRING,
      },
      mensaje: {
        type: Sequelize.TEXT,
      },
      es_admin_mensaje: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
    await queryInterface.dropTable('notificacion');
  }
};

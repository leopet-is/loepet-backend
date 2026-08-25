'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('solicitudes_fundacion', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      ruc: {
        type: Sequelize.STRING(13),
        allowNull: false,
        unique: true,
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      direccion: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      telefono: {
        type: Sequelize.STRING(15),
        allowNull: false,
      },
      email_contacto: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      nombre_contacto: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      apellido_contacto: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      cedula_contacto: {
        type: Sequelize.STRING(15),
        allowNull: false,
      },
      comentarios: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'aprobada', 'rechazada'),
        defaultValue: 'pendiente',
        allowNull: false,
      },
      ready_for_creation: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      notas_admin: {
        type: Sequelize.TEXT,
        allowNull: true,
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
    await queryInterface.dropTable('solicitudes_fundacion');
  }
};

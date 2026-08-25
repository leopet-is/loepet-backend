'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('fundacion', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      ruc: {
        type: Sequelize.STRING,
      },
      nombre: {
        type: Sequelize.STRING,
      },
      direccion: {
        type: Sequelize.STRING,
      },
      telefono: {
        type: Sequelize.STRING,
      },
      aprobado: {
        type: Sequelize.BOOLEAN,
      },
      comision: {
        type: Sequelize.DECIMAL,
      },
      logo: {
        type: Sequelize.STRING,
      },
      descripcion: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable('fundacion');
  }
};

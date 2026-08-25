'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('animal', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nombre: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.STRING,
      },
      especie: {
        type: Sequelize.STRING,
      },
      raza: {
        type: Sequelize.STRING,
      },
      descripcion: {
        type: Sequelize.STRING,
      },
      imagen: {
        type: Sequelize.STRING,
      },
      galeria: {
        type: Sequelize.JSON,
      },
      fundacion_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'fundacion',
          key: 'id',
        },
      },
      visible: {
        type: Sequelize.BOOLEAN,
      },
      edad: {
        type: Sequelize.INTEGER,
      },
      peso: {
        type: Sequelize.INTEGER,
      },
      sexo: {
        type: Sequelize.BOOLEAN,
      },
      enfermedades: {
        type: Sequelize.STRING,
      },
      fecha_rescate: {
        type: Sequelize.DATE,
      },
      fecha_registro: {
        type: Sequelize.DATE,
      },
      esterilizacion: {
        type: Sequelize.BOOLEAN,
      },
      vacunacion: {
        type: Sequelize.BOOLEAN,
      },
      desparasitacion: {
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
    await queryInterface.dropTable('animal');
  }
};

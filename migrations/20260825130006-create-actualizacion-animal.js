'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('actualizacion_animal', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      animal_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'animal',
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
      fecha: {
        type: Sequelize.DATE,
      },
      descripcion: {
        type: Sequelize.STRING,
      },
      estado_salud: {
        type: Sequelize.STRING,
      },
      imagen: {
        type: Sequelize.STRING,
      },
      calificacion: {
        type: Sequelize.INTEGER,
      },
      visible: {
        type: Sequelize.BOOLEAN,
      },
      galeria: {
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
    await queryInterface.dropTable('actualizacion_animal');
  }
};

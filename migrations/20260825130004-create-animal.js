'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('animal', {
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
      status: {
        type: Sequelize.ENUM('DISPONIBLE', 'EN_PROCESO', 'ADOPTADO'),
        allowNull: false,
        defaultValue: 'DISPONIBLE',
      },
      especie: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      raza: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      imagen: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      galeria: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      fundacion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'fundacion',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      edad: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      peso: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      sexo: {
        type: Sequelize.ENUM('MACHO', 'HEMBRA'),
        allowNull: false,
      },
      enfermedades: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fecha_rescate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      fecha_registro: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      esterilizacion: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      vacunacion: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      desparasitacion: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    await queryInterface.addIndex('animal', ['fundacion_id'], {
      name: 'animal_fundacion_id_idx',
    });
    await queryInterface.addIndex('animal', ['status'], {
      name: 'animal_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('animal');
  },
};

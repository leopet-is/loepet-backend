'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('actualizacion_animal', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      animal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'animal',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      fecha: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      estado_salud: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      imagen: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      calificacion: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      galeria: {
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

    await queryInterface.addIndex('actualizacion_animal', ['animal_id'], {
      name: 'actualizacion_animal_animal_id_idx',
    });
    await queryInterface.addIndex('actualizacion_animal', ['fundacion_id'], {
      name: 'actualizacion_animal_fundacion_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('actualizacion_animal');
  },
};

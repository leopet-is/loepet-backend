'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('favorito_fundacion', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'id',
        },
      },
      fundacion_id: {
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

    await queryInterface.addIndex('favorito_fundacion', {
      fields: ['usuario_id', 'fundacion_id'],
      unique: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('favorito_fundacion');
  }
};

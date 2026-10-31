/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('comision_manada', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      comision_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'comision',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      manada_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'manada',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      comision: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      monto_a_pagar: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
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

    await queryInterface.addIndex('comision_manada', ['comision_id'], {
      name: 'comision_manada_comision_id_idx',
    });
    await queryInterface.addIndex('comision_manada', ['manada_id'], {
      name: 'comision_manada_manada_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('comision_manada');
  },
};

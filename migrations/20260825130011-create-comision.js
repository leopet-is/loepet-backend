/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('comision', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
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
      total_comision: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false,
        defaultValue: 0,
      },
      total_pago: {
        type: Sequelize.DECIMAL(11, 2),
        allowNull: false,
        defaultValue: 0,
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

    await queryInterface.addIndex('comision', ['fundacion_id'], {
      name: 'comision_fundacion_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('comision');
  },
};

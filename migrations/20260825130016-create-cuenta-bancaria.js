/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cuenta_bancaria', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      banco: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      numero: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      tipo: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      nombre: {
        type: Sequelize.STRING(150),
        allowNull: false,
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
      principal: {
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

    await queryInterface.addIndex('cuenta_bancaria', ['fundacion_id'], {
      name: 'cuenta_bancaria_fundacion_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cuenta_bancaria');
  },
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('fundacion', {
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
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      direccion: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      telefono: {
        type: Sequelize.STRING(15),
        allowNull: false,
      },
      aprobado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      comision: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      logo: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      descripcion: {
        type: Sequelize.TEXT,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('fundacion');
  },
};

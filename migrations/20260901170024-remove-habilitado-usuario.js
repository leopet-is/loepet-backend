/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Consolidar el booleano "habilitado" en el estado del ciclo de vida:
    // un usuario deshabilitado pasa a INACTIVO; el resto conserva su estado.
    await queryInterface.sequelize.query(`
      UPDATE usuario
      SET estado = 'INACTIVO'
      WHERE habilitado = false
        AND estado <> 'INACTIVO'
    `);

    await queryInterface.removeColumn('usuario', 'habilitado');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuario', 'habilitado', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    // Un usuario INACTIVO se representa como deshabilitado (habilitado=false).
    await queryInterface.sequelize.query(`
      UPDATE usuario
      SET habilitado = false
      WHERE estado = 'INACTIVO'
    `);
  },
};

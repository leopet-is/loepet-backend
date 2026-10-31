/** @type {import('sequelize-cli').Migration} */
async function columnExists(queryInterface, table, column) {
  const [rows] = await queryInterface.sequelize.query(
    'SELECT 1 FROM information_schema.columns WHERE table_schema = :schema AND table_name = :table AND column_name = :column',
    { replacements: { schema: 'public', table, column } },
  );
  return rows.length > 0;
}

module.exports = {
  async up(queryInterface) {
    // Consolidar el booleano "habilitado" en el estado del ciclo de vida:
    // un usuario deshabilitado pasa a INACTIVO; el resto conserva su estado.
    if (await columnExists(queryInterface, 'usuario', 'habilitado')) {
      await queryInterface.sequelize.query(`
        UPDATE usuario
        SET estado = 'INACTIVO'
        WHERE habilitado = false
          AND estado <> 'INACTIVO'
      `);

      await queryInterface.removeColumn('usuario', 'habilitado');
    }
  },

  async down(queryInterface, Sequelize) {
    if (!(await columnExists(queryInterface, 'usuario', 'habilitado'))) {
      await queryInterface.addColumn('usuario', 'habilitado', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }

    // Un usuario INACTIVO se representa como deshabilitado (habilitado=false).
    if (await columnExists(queryInterface, 'usuario', 'estado')) {
      await queryInterface.sequelize.query(`
        UPDATE usuario
        SET habilitado = false
        WHERE estado = 'INACTIVO'
      `);
    }
  },
};

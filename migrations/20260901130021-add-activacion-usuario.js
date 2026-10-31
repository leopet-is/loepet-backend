/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('usuario');

    // Estados del ciclo de vida de la cuenta de usuario. Los registros
    // existentes quedan ACTIVO (default).
    if (!columns.estado) {
      await queryInterface.addColumn('usuario', 'estado', {
        type: Sequelize.ENUM(
          'PENDIENTE_ACTIVACION',
          'ACTIVO',
          'INACTIVO',
          'BLOQUEADO',
        ),
        allowNull: false,
        defaultValue: 'ACTIVO',
      });
    }

    // Token de activacion: solo se guarda mientras la cuenta esta pendiente.
    if (!columns.activation_token) {
      await queryInterface.addColumn('usuario', 'activation_token', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    // Fecha limite para usar el token de activacion (24h desde su generacion).
    if (!columns.activation_expires) {
      await queryInterface.addColumn('usuario', 'activation_expires', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    // La contrasena puede ser nula: el usuario de fundacion la define al
    // activar su cuenta con el token recibido por correo.
    await queryInterface.changeColumn('usuario', 'password', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('usuario', 'activation_expires');
    await queryInterface.removeColumn('usuario', 'activation_token');
    await queryInterface.removeColumn('usuario', 'estado');

    await queryInterface.changeColumn('usuario', 'password', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_usuario_estado"');
  },
};

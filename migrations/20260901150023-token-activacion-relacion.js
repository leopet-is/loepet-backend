/** @type {import('sequelize-cli').Migration} */
async function tableExists(queryInterface, table) {
  const [rows] = await queryInterface.sequelize.query(
    'SELECT 1 FROM information_schema.tables WHERE table_schema = :schema AND table_name = :table',
    { replacements: { schema: 'public', table } },
  );
  return rows.length > 0;
}

async function columnExists(queryInterface, table, column) {
  const [rows] = await queryInterface.sequelize.query(
    'SELECT 1 FROM information_schema.columns WHERE table_schema = :schema AND table_name = :table AND column_name = :column',
    { replacements: { schema: 'public', table, column } },
  );
  return rows.length > 0;
}

async function indexExists(queryInterface, index) {
  const [rows] = await queryInterface.sequelize.query(
    'SELECT 1 FROM pg_indexes WHERE schemaname = :schema AND indexname = :index',
    { replacements: { schema: 'public', index } },
  );
  return rows.length > 0;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Tabla de tokens de activacion: un solo token vigente por usuario.
    if (!(await tableExists(queryInterface, 'token_activacion'))) {
      await queryInterface.createTable('token_activacion', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          allowNull: false,
          autoIncrement: true,
        },
        usuario_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
          references: {
            model: 'usuario',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        token: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true,
        },
        expires_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        usado: {
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
    }

    // 2. Migrar los tokens de cuentas aun pendientes de activacion.
    if (await columnExists(queryInterface, 'usuario', 'activation_token')
      && await columnExists(queryInterface, 'usuario', 'activation_expires')) {
      await queryInterface.sequelize.query(`
        INSERT INTO token_activacion (usuario_id, token, expires_at, usado, "createdAt", "updatedAt")
        SELECT id, activation_token, activation_expires, false, NOW(), NOW()
        FROM usuario
        WHERE activation_token IS NOT NULL
        ON CONFLICT DO NOTHING
      `);
    }

    // 3. Quitar de usuario los campos movidos a token_activacion.
    if (await columnExists(queryInterface, 'usuario', 'activation_expires')) {
      await queryInterface.removeColumn('usuario', 'activation_expires');
    }
    if (await columnExists(queryInterface, 'usuario', 'activation_token')) {
      await queryInterface.removeColumn('usuario', 'activation_token');
    }

    // 4. Proveniencia de la fundacion: la solicitud aprobada que la origino.
    //    Si la solicitud se elimina, la fundacion conserva su historial (SET NULL).
    if (!(await columnExists(queryInterface, 'fundacion', 'solicitud_id'))) {
      await queryInterface.addColumn('fundacion', 'solicitud_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'solicitudes_fundacion',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    // 5. Cedula unica en usuario (mismo criterio que RUC en fundacion).
    const [duplicates] = await queryInterface.sequelize.query(
      'SELECT cedula, COUNT(*)::int AS n FROM usuario WHERE cedula IS NOT NULL GROUP BY cedula HAVING COUNT(*) > 1',
    );
    if (duplicates.length > 0) {
      throw new Error(
        `No se puede crear el indice unico de cedula: existen cedulas duplicadas en usuario (${duplicates
          .map((d) => d.cedula)
          .join(', ')})`,
      );
    }

    if (!(await indexExists(queryInterface, 'usuario_cedula_unique'))) {
      await queryInterface.addIndex('usuario', ['cedula'], {
        name: 'usuario_cedula_unique',
        unique: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('usuario', 'usuario_cedula_unique');

    // Restituir columnas de token en usuario (best effort: solo tokens vigentes).
    await queryInterface.addColumn('usuario', 'activation_token', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('usuario', 'activation_expires', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.sequelize.query(`
      UPDATE usuario u
      SET activation_token = t.token, activation_expires = t.expires_at
      FROM token_activacion t
      WHERE t.usuario_id = u.id AND t.usado = false
    `);

    await queryInterface.removeColumn('fundacion', 'solicitud_id');

    await queryInterface.dropTable('token_activacion');
  },
};

/** @type {import('sequelize-cli').Migration} */

// Ayudantes para que la migracion sea idempotente.
async function columnExists(seq, table, column) {
  const [rows] = await seq.query(
    'SELECT 1 FROM information_schema.columns WHERE table_name = :table AND column_name = :col',
    { replacements: { table, col: column } },
  );
  return rows.length > 0;
}

async function tableExists(seq, table) {
  const [rows] = await seq.query(
    'SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = :table',
    { replacements: { table } },
  );
  return rows.length > 0;
}

// listColumns: devuelve las manada que tenian datos de pasarela previos.
async function manadasConPasarela(seq) {
  const [rows] = await seq.query(`
    SELECT
      id,
      monto,
      "statusSubscription",
      "productId",
      "responseProduct",
      "planId",
      "responsePlan",
      "subscriptionId",
      "responseSubscription"
    FROM manada
    WHERE "subscriptionId" IS NOT NULL
       OR "productId" IS NOT NULL
       OR "planId" IS NOT NULL
       OR monto IS NOT NULL;
  `);
  return rows;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const seq = queryInterface.sequelize;

    // -----------------------------------------------------------------
    // 0. (Previo) Si las columnas aun existen en manada, respaldar la
    //    informacion de pasarela antes de eliminarla. Con esto no se pierden
    //    datos historicos: cada manada con suscripcion activa genera un
    //    registro en suscripcion_padrino.
    // -----------------------------------------------------------------
    const tieneColumnasPasarela = await columnExists(seq, 'manada', 'subscriptionId');
    const deps = [];
    if (tieneColumnasPasarela) {
      const rows = await manadasConPasarela(seq);
      rows.forEach((r) => {
        deps.push({
          manadaId: r.id,
          montoTotal: r.monto == null ? 0 : r.monto,
          statusSubscription: r.statusSubscription === true,
          productId: r.productId,
          responseProduct: r.responseProduct,
          planId: r.planId,
          responsePlan: r.responsePlan,
          subscriptionId: r.subscriptionId,
          responseSubscription: r.responseSubscription,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
    }

    // -----------------------------------------------------------------
    // 1. Crear suscripcion_padrino (con backfill) y rating_actualizacion.
    // -----------------------------------------------------------------
    await queryInterface.createTable('suscripcion_padrino', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      manadaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'manada',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      montoTotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      statusSubscription: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      productId: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      responseProduct: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      planId: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      responsePlan: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      subscriptionId: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      responseSubscription: {
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
    await queryInterface.addIndex('suscripcion_padrino', ['manadaId'], {
      name: 'suscripcion_padrino_manada_id_idx',
    });
    if (deps.length > 0) {
      await queryInterface.bulkInsert('suscripcion_padrino', deps);
    }

    await queryInterface.createTable('rating_actualizacion', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      actualizacionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'actualizacion_animal',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      estrellas: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      comentario: {
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
    // Un usuario solo puede calificar una misma actualizacion una vez.
    await queryInterface.addIndex('rating_actualizacion', ['actualizacionId', 'userId'], {
      unique: true,
      name: 'rating_actualizacion_actualizacion_usuario_uniq',
    });

    // -----------------------------------------------------------------
    // 2. Limpiar manada: eliminar los campos de pasarela desacoplados.
    // -----------------------------------------------------------------
    const columnasARemover = [
      'monto',
      'statusSubscription',
      'productId',
      'responseProduct',
      'planId',
      'responsePlan',
      'subscriptionId',
      'responseSubscription',
      'galeriamanada',
    ];
    for (let i = 0; i < columnasARemover.length; i += 1) {
      const col = columnasARemover[i];
      // eslint-disable-next-line no-await-in-loop
      if (await columnExists(seq, 'manada', col)) {
        // eslint-disable-next-line no-await-in-loop
        await queryInterface.removeColumn('manada', col);
      }
    }

    // -----------------------------------------------------------------
    // 3. Eliminar la tabla rating (reemplazada por rating_actualizacion).
    // -----------------------------------------------------------------
    if (await tableExists(seq, 'rating')) {
      await queryInterface.dropTable('rating');
    }
  },

  async down(queryInterface, Sequelize) {
    const seq = queryInterface.sequelize;

    // Restaurar tabla rating
    if (!(await tableExists(seq, 'rating'))) {
      await queryInterface.createTable('rating', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        valor: {
          type: Sequelize.DECIMAL(3, 2),
          allowNull: false,
        },
        actualizacion_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'actualizacion_animal',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
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
      await queryInterface.addIndex('rating', ['actualizacion_id'], {
        name: 'rating_actualizacion_id_idx',
      });
    }

    // Restaurar columnas de pasarela en manada
    if (!(await columnExists(seq, 'manada', 'monto'))) {
      await queryInterface.addColumn('manada', 'monto', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      });
    }
    if (!(await columnExists(seq, 'manada', 'statusSubscription'))) {
      await queryInterface.addColumn('manada', 'statusSubscription', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
    if (!(await columnExists(seq, 'manada', 'productId'))) {
      await queryInterface.addColumn('manada', 'productId', {
        type: Sequelize.STRING(191),
        allowNull: true,
      });
    }
    if (!(await columnExists(seq, 'manada', 'responseProduct'))) {
      await queryInterface.addColumn('manada', 'responseProduct', {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }
    if (!(await columnExists(seq, 'manada', 'planId'))) {
      await queryInterface.addColumn('manada', 'planId', {
        type: Sequelize.STRING(191),
        allowNull: true,
      });
    }
    if (!(await columnExists(seq, 'manada', 'responsePlan'))) {
      await queryInterface.addColumn('manada', 'responsePlan', {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }
    if (!(await columnExists(seq, 'manada', 'subscriptionId'))) {
      await queryInterface.addColumn('manada', 'subscriptionId', {
        type: Sequelize.STRING(191),
        allowNull: true,
      });
    }
    if (!(await columnExists(seq, 'manada', 'responseSubscription'))) {
      await queryInterface.addColumn('manada', 'responseSubscription', {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }
    if (!(await columnExists(seq, 'manada', 'galeriamanada'))) {
      await queryInterface.addColumn('manada', 'galeriamanada', {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }

    // Reintegrar datos de suscripcion_padrino de vuelta a manada
    if (await tableExists(seq, 'suscripcion_padrino')) {
      const [rows] = await seq.query('SELECT * FROM suscripcion_padrino;');
      rows.forEach((r) => {
        seq.query(
          'UPDATE manada SET "monto" = :monto, "statusSubscription" = :ss, "productId" = :pid, "responseProduct" = :rp, "planId" = :plid, "responsePlan" = :rpln, "subscriptionId" = :sid, "responseSubscription" = :rs WHERE id = :mid;',
          {
            replacements: {
              monto: r.montoTotal,
              ss: r.statusSubscription,
              pid: r.productId,
              rp: r.responseProduct,
              plid: r.planId,
              rpln: r.responsePlan,
              sid: r.subscriptionId,
              rs: r.responseSubscription,
              mid: r.manadaId,
            },
          },
        ).catch(() => {});
      });
    }

    // Eliminar rating_actualizacion
    if (await tableExists(seq, 'rating_actualizacion')) {
      await queryInterface.dropTable('rating_actualizacion');
    }
    // Eliminar suscripcion_padrino
    if (await tableExists(seq, 'suscripcion_padrino')) {
      await queryInterface.dropTable('suscripcion_padrino');
    }
  },
};

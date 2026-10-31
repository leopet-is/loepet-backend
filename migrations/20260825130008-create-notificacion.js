/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notificacion', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      actualizacion_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'actualizacion_animal',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      leido: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      fecha_leido: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      calificacion: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      fecha_calificacion: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      es_alerta_salud: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      descripcion_alerta: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      mensaje: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      es_admin_mensaje: {
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

    await queryInterface.addIndex('notificacion', ['usuario_id'], {
      name: 'notificacion_usuario_id_idx',
    });
    await queryInterface.addIndex('notificacion', ['animal_id'], {
      name: 'notificacion_animal_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notificacion');
  },
};

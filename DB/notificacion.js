module.exports = (sequelize, DataTypes) => {
  const Notificacion = sequelize.define(
    'Notificacion',
    {
      actualizacion_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'actualizacion_animal',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      fundacion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'fundacion',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      animal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'animal',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      visible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      leido: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      fecha_leido: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      calificacion: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      fecha_calificacion: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      es_alerta_salud: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      descripcion_alerta: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      mensaje: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      es_admin_mensaje: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'notificacion',
      timestamps: true,
    },
  );

  Notificacion.associate = (models) => {
    Notificacion.belongsTo(models.ActualizacionAnimal, {
      foreignKey: 'actualizacion_id',
      as: 'actualizacion',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    Notificacion.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    Notificacion.belongsTo(models.Fundacion, {
      foreignKey: 'fundacion_id',
      as: 'fundacion',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    Notificacion.belongsTo(models.Animal, {
      foreignKey: 'animal_id',
      as: 'animal',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return Notificacion;
};

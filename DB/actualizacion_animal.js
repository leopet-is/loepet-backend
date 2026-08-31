module.exports = (sequelize, DataTypes) => {
  const ActualizacionAnimal = sequelize.define(
    'ActualizacionAnimal',
    {
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
      fecha: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      estado_salud: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      imagen: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      calificacion: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      visible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      galeria: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: 'actualizacion_animal',
      timestamps: true,
    },
  );

  ActualizacionAnimal.associate = (models) => {
    ActualizacionAnimal.belongsTo(models.Animal, {
      foreignKey: 'animal_id',
      as: 'animal',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    ActualizacionAnimal.belongsTo(models.Fundacion, {
      foreignKey: 'fundacion_id',
      as: 'fundacion',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    ActualizacionAnimal.hasMany(models.ActualizacionGaleria, {
      foreignKey: 'actualizacion_id',
      as: 'galeriaItems',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    ActualizacionAnimal.hasMany(models.Rating, {
      foreignKey: 'actualizacion_id',
      as: 'ratings',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    ActualizacionAnimal.hasMany(models.Notificacion, {
      foreignKey: 'actualizacion_id',
      as: 'notificaciones',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return ActualizacionAnimal;
};

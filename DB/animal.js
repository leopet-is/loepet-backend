module.exports = (sequelize, DataTypes) => {
  const Animal = sequelize.define(
    'Animal',
    {
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('DISPONIBLE', 'EN_PROCESO', 'ADOPTADO'),
        allowNull: false,
        defaultValue: 'DISPONIBLE',
      },
      especie: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      raza: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      imagen: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      galeria: {
        type: DataTypes.JSON,
        allowNull: true,
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
      edad: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      peso: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      sexo: {
        type: DataTypes.ENUM('MACHO', 'HEMBRA'),
        allowNull: false,
      },
      enfermedades: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fecha_rescate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      fecha_registro: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      esterilizacion: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      vacunacion: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      desparasitacion: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'animal',
      timestamps: true,
    },
  );

  Animal.associate = function associate(models) {
    Animal.belongsTo(models.Fundacion, {
      foreignKey: 'fundacion_id',
      as: 'fundacion',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    Animal.hasMany(models.ManadaAnimal, {
      foreignKey: 'animal_id',
      as: 'manadasAnimales',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Animal.hasMany(models.ActualizacionAnimal, {
      foreignKey: 'animal_id',
      as: 'actualizaciones',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Animal.hasMany(models.Donacion, {
      foreignKey: 'animal_id',
      as: 'donaciones',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Animal.hasMany(models.ComisionManada, {
      foreignKey: 'animal_id',
      as: 'comisionesManada',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Animal.hasMany(models.Notificacion, {
      foreignKey: 'animal_id',
      as: 'notificaciones',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return Animal;
};

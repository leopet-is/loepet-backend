module.exports = (sequelize, DataTypes) => {
  const Donacion = sequelize.define(
    'Donacion',
    {
      donador_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
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
      monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      aprobado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pagado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    },
    {
      tableName: 'donacion',
      timestamps: true,
    },
  );

  Donacion.associate = (models) => {
    Donacion.belongsTo(models.Usuario, {
      foreignKey: 'donador_id',
      as: 'donador',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    Donacion.belongsTo(models.Animal, {
      foreignKey: 'animal_id',
      as: 'animal',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return Donacion;
};

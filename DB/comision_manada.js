module.exports = (sequelize, DataTypes) => {
  const ComisionManada = sequelize.define(
    'ComisionManada',
    {
      comision_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'comision',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      manada_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'manada',
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
      comision: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      monto_a_pagar: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
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
      tableName: 'comision_manada',
      timestamps: true,
    },
  );

  ComisionManada.associate = (models) => {
    ComisionManada.belongsTo(models.Comision, {
      foreignKey: 'comision_id',
      as: 'comisionPadre',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    ComisionManada.belongsTo(models.Manada, {
      foreignKey: 'manada_id',
      as: 'manada',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    ComisionManada.belongsTo(models.Animal, {
      foreignKey: 'animal_id',
      as: 'animal',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return ComisionManada;
};

module.exports = (sequelize, DataTypes) => {
  const ComisionManada = sequelize.define(
    'ComisionManada',
    {
      comision_id: {
        type: DataTypes.INTEGER,
      },
      manada_id: {
        type: DataTypes.INTEGER,
      },
      animal_id: {
        type: DataTypes.INTEGER,
      },
      monto: {
        type: DataTypes.DOUBLE(10, 2),
      },
      comision: {
        type: DataTypes.DOUBLE(10, 2),
      },
      monto_a_pagar: {
        type: DataTypes.DOUBLE(10, 2),
      },
      createdAt: {
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: 'comision_manada',
    },
  );

  ComisionManada.associate = (models) => {
    ComisionManada.belongsTo(models.Comision, {
      foreignKey: 'comision_id',
    });
    ComisionManada.belongsTo(models.Manada, {
      foreignKey: 'manada_id',
    });
    ComisionManada.belongsTo(models.Animal, {
      foreignKey: 'animal_id',
    });
  };

  return ComisionManada;
};

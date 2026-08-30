module.exports = (sequelize, DataTypes) => {
  const Comision = sequelize.define(
    'Comision',
    {
      fundacion_id: {
        type: DataTypes.INTEGER,
      },
      createdAt: {
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
      visible: {
        type: DataTypes.BOOLEAN,
      },
      total_comision: {
        type: DataTypes.DECIMAL(11, 2),
      },
      total_pago: {
        type: DataTypes.DECIMAL(11, 2),
      },
    },
    {
      tableName: 'comision',
    },
  );

  Comision.associate = (models) => {
    Comision.hasMany(models.ComisionManada, {
      foreignKey: 'comision_id',
    });
    Comision.belongsTo(models.Fundacion, {
      foreignKey: 'fundacion_id',
    });
  };

  return Comision;
};

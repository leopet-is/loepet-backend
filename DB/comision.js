module.exports = (sequelize, DataTypes) => {
  const Comision = sequelize.define(
    'Comision',
    {
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
      total_comision: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: false,
        defaultValue: 0,
      },
      total_pago: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'comision',
      timestamps: true,
    },
  );

  Comision.associate = (models) => {
    Comision.hasMany(models.ComisionManada, {
      foreignKey: 'comision_id',
      as: 'comisionManadas',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Comision.belongsTo(models.Fundacion, {
      foreignKey: 'fundacion_id',
      as: 'fundacion',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return Comision;
};

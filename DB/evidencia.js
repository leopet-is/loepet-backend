module.exports = (sequelize, DataTypes) => {
  const Evidencia = sequelize.define(
    'Evidencia',
    {
      donacion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'donacion',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      galeria: {
        type: DataTypes.JSON,
        allowNull: true,
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
      tableName: 'evidencia',
      timestamps: true,
    },
  );

  Evidencia.associate = (models) => {
    Evidencia.belongsTo(models.Donacion, {
      foreignKey: 'donacion_id',
      as: 'donacion',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return Evidencia;
};

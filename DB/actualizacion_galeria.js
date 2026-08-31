module.exports = (sequelize, DataTypes) => {
  const ActualizacionGaleria = sequelize.define(
    'ActualizacionGaleria',
    {
      actualizacion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'actualizacion_animal',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      url: {
        type: DataTypes.STRING(500),
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
      tableName: 'actualizacion_galeria',
      timestamps: true,
    },
  );

  ActualizacionGaleria.associate = (models) => {
    ActualizacionGaleria.belongsTo(models.ActualizacionAnimal, {
      foreignKey: 'actualizacion_id',
      as: 'actualizacion',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return ActualizacionGaleria;
};

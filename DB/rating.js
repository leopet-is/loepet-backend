module.exports = (sequelize, DataTypes) => {
  const Rating = sequelize.define(
    'Rating',
    {
      valor: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
      },
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
      tableName: 'rating',
      timestamps: true,
    },
  );

  Rating.associate = (models) => {
    Rating.belongsTo(models.ActualizacionAnimal, {
      foreignKey: 'actualizacion_id',
      as: 'actualizacion',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return Rating;
};

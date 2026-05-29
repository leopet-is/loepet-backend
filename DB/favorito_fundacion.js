module.exports = (sequelize, DataTypes) => {
  const FavoritoFundacion = sequelize.define(
    'FavoritoFundacion',
    {
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fundacion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: 'favorito_fundacion',
      indexes: [
        {
          unique: true,
          fields: ['usuario_id', 'fundacion_id'],
        },
      ],
    },
  );

  FavoritoFundacion.associate = (models) => {
    FavoritoFundacion.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
    });
    FavoritoFundacion.belongsTo(models.Fundacion, {
      foreignKey: 'fundacion_id',
    });
  };

  return FavoritoFundacion;
};

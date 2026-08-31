module.exports = (sequelize, DataTypes) => {
  const FavoritoFundacion = sequelize.define(
    'FavoritoFundacion',
    {
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      tableName: 'favorito_fundacion',
      timestamps: true,
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
      as: 'usuario',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    FavoritoFundacion.belongsTo(models.Fundacion, {
      foreignKey: 'fundacion_id',
      as: 'fundacion',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return FavoritoFundacion;
};

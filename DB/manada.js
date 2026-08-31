module.exports = (sequelize, DataTypes) => {
  const Manada = sequelize.define(
    'Manada',
    {
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      statusSubscription: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      productId: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },
      responseProduct: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      planId: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },
      responsePlan: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      subscriptionId: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },
      responseSubscription: {
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
      galeriamanada: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: 'manada',
      timestamps: true,
    },
  );

  Manada.associate = (models) => {
    Manada.belongsTo(models.Usuario, {
      foreignKey: 'userId',
      as: 'usuario',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    Manada.hasMany(models.ManadaAnimal, {
      foreignKey: 'manada_id',
      as: 'manadaAnimales',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Manada.hasMany(models.ComisionManada, {
      foreignKey: 'manada_id',
      as: 'comisionesManada',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return Manada;
};

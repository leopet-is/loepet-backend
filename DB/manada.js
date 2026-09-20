module.exports = (sequelize, DataTypes) => {
  const Manada = sequelize.define(
    'Manada',
    {
      nombre: {
        type: DataTypes.STRING(100),
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
    /* Cada manada tiene a lo sumo una suscripcion de apadrinamiento activa. */
    Manada.hasOne(models.SuscripcionPadrino, {
      foreignKey: 'manadaId',
      as: 'suscripcionPadrino',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
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

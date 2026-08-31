module.exports = (sequelize, DataTypes) => {
  const Fundacion = sequelize.define(
    'Fundacion',
    {
      ruc: {
        type: DataTypes.STRING(13),
        allowNull: false,
        unique: true,
      },
      nombre: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      direccion: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      telefono: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      aprobado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      comision: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      logo: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      descripcion: {
        type: DataTypes.TEXT,
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
      tableName: 'fundacion',
      timestamps: true,
    },
  );

  Fundacion.associate = function associate(models) {
    Fundacion.hasMany(models.Animal, {
      foreignKey: 'fundacion_id',
      as: 'animales',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Fundacion.hasMany(models.AdminFund, {
      foreignKey: 'fundacion_id',
      as: 'administradores',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Fundacion.hasMany(models.Denuncia, {
      foreignKey: 'fundacionId',
      as: 'denunciasRecibidas',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Fundacion.hasMany(models.CuentaBancaria, {
      foreignKey: 'fundacion_id',
      as: 'cuentasBancarias',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Fundacion.hasMany(models.Comision, {
      foreignKey: 'fundacion_id',
      as: 'comisiones',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Fundacion.hasMany(models.ActualizacionAnimal, {
      foreignKey: 'fundacion_id',
      as: 'actualizaciones',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Fundacion.hasMany(models.Notificacion, {
      foreignKey: 'fundacion_id',
      as: 'notificaciones',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Fundacion.hasMany(models.FavoritoFundacion, {
      foreignKey: 'fundacion_id',
      as: 'favoritos',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return Fundacion;
};

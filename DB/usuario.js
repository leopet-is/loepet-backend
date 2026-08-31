module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    'Usuario',
    {
      cedula: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      nombres: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      apellidos: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      telefono: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      direccion: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      habilitado: {
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
      tableName: 'usuario',
      timestamps: true,
    },
  );

  Usuario.associate = function associate(models) {
    Usuario.hasMany(models.Denuncia, {
      foreignKey: 'usuarioId',
      as: 'denunciasRealizadas',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Usuario.hasMany(models.Manada, {
      foreignKey: 'userId',
      as: 'manadas',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Usuario.hasMany(models.Donacion, {
      foreignKey: 'donador_id',
      as: 'donaciones',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Usuario.hasMany(models.Notificacion, {
      foreignKey: 'usuario_id',
      as: 'notificaciones',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Usuario.hasMany(models.FavoritoFundacion, {
      foreignKey: 'usuario_id',
      as: 'favoritos',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return Usuario;
};

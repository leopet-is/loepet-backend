const { USUARIO_ESTADO } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    'Usuario',
    {
      cedula: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
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
      /* La contrasena es nula para los usuarios creados al aprobar una
       * solicitud de fundacion: solo se asigna cuando la fundacion activa su
       * cuenta con el token recibido por correo. */
      password: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      role: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      /* Estado del ciclo de vida de la cuenta. Los registros pre-existentes
       * permanecen ACTIVO por default (ver migracion). */
      estado: {
        type: DataTypes.ENUM(
          USUARIO_ESTADO.PENDIENTE_ACTIVACION,
          USUARIO_ESTADO.ACTIVO,
          USUARIO_ESTADO.INACTIVO,
          USUARIO_ESTADO.BLOQUEADO,
        ),
        allowNull: false,
        defaultValue: USUARIO_ESTADO.ACTIVO,
      },
      /* El token de activacion no vive aqui: se guarda en la tabla
       * token_activacion (uno por usuario) mientras la cuenta esta en
       * PENDIENTE_ACTIVACION, y se marca como usado al activar la cuenta. */
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
    Usuario.hasMany(models.RatingActualizacion, {
      foreignKey: 'userId',
      as: 'ratingsActualizacion',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return Usuario;
};

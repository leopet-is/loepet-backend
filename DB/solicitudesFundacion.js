const { SOLICITUD_FUNDACION_ESTADO } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const SolicitudFundacion = sequelize.define(
    'SolicitudFundacion',
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
      email_contacto: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      nombre_contacto: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      apellido_contacto: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      cedula_contacto: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      comentarios: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      estado: {
        type: DataTypes.ENUM(
          SOLICITUD_FUNDACION_ESTADO.PENDIENTE,
          SOLICITUD_FUNDACION_ESTADO.APROBADA,
          SOLICITUD_FUNDACION_ESTADO.RECHAZADA,
        ),
        defaultValue: SOLICITUD_FUNDACION_ESTADO.PENDIENTE,
        allowNull: false,
      },
      ready_for_creation: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      notas_admin: {
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
      tableName: 'solicitudes_fundacion',
      timestamps: true,
    },
  );

  return SolicitudFundacion;
};

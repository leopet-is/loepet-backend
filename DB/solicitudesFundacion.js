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
        type: DataTypes.STRING,
        allowNull: false,
      },
      direccion: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      telefono: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      email_contacto: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      nombre_contacto: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      apellido_contacto: {
        type: DataTypes.STRING,
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
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: 'solicitudes_fundacion',
    },
  );

  return SolicitudFundacion;
};

require('dotenv').config();

module.exports = {
  STATUS_ANIMAL: {
    DISPONIBLE: 'DISPONIBLE',
    EN_PROCESO: 'EN_PROCESO',
    ADOPTADO: 'ADOPTADO',
  },
  ROL: {
    ADMIN: {
      ROL_ID: 1,
      ROL: 'ADMINISTRADOR',
    },
    ADMIN_FUND: {
      ROL_ID: 2,
      ROL: 'ADMINISTRADOR_FUNDACION',
    },
    DONADOR: {
      ROL_ID: 3,
      ROL: 'DONADOR',
    },
  },
  SOLICITUD_FUNDACION_ESTADO: {
    PENDIENTE: 'pendiente',
    APROBADA: 'aprobada',
    RECHAZADA: 'rechazada',
  },
};

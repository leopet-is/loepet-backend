require('dotenv').config();

module.exports = {
  STATUS_ANIMAL: {
    NO_APADRINADO: 'NO_APADRINADO',
    APADRINADO: 'APADRINADO',
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

require('dotenv').config();

module.exports = {
  STATUS_ANIMAL: {
    REQUIERE_PADRINOS: 'REQUIERE_PADRINOS',
    APADRINADO: 'APADRINADO',
    EN_TRATAMIENTO: 'EN_TRATAMIENTO',
    FALLECIDO: 'FALLECIDO',
    INACTIVO: 'INACTIVO',
  },
  ESPECIE_ANIMAL: {
    PERRO: 'PERRO',
    GATO: 'GATO',
    OTRO: 'OTRO',
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
  /* Estados del ciclo de vida de un usuario de fundacion. El usuario se crea
   * cuando el administrador aprueba la solicitud, pero no puede iniciar sesion
   * hasta activar su cuenta con el token de activacion recibido por correo. */
  USUARIO_ESTADO: {
    PENDIENTE_ACTIVACION: 'PENDIENTE_ACTIVACION',
    ACTIVO: 'ACTIVO',
    INACTIVO: 'INACTIVO',
    BLOQUEADO: 'BLOQUEADO',
  },
};

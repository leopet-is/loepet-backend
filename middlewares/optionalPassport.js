const _ = require('lodash');
const jwt = require('jsonwebtoken');

const db = require('../DB/index');
const { ROL, USUARIO_ESTADO } = require('../constants');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'secret');

const optionalPassport = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return next();

    const decode = jwt.verify(token, JWT_SECRET);
    const User = await db.Usuario.findOne({
      where: {
        id: decode.id,
      },
    });
    if (_.isEmpty(User)) return next();

    if (User.estado === USUARIO_ESTADO.INACTIVO
      || User.estado === USUARIO_ESTADO.BLOQUEADO
      || User.estado === USUARIO_ESTADO.PENDIENTE_ACTIVACION) {
      return next();
    }

    const data = {
      id: User.id,
      role: User.role,
    };
    if (_.isEqual(decode.role, ROL.ADMIN_FUND.ROL_ID)) {
      const admin = await db.AdminFund.findOne({
        where: {
          id: decode.id,
        },
      });
      if (admin) {
        data.fundacionId = admin.fundacion_id;
      }
    }
    req.User = data;
    return next();
  } catch (error) {
    // En rutas con autenticación opcional, un token inválido o expirado
    // no debe bloquear el acceso: se continúa como visitante público.
    return next();
  }
};

module.exports = optionalPassport;

const _ = require('lodash');
const jwt = require('jsonwebtoken');

const db = require('../DB/index');
const { ROL, USUARIO_ESTADO } = require('../constants');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'secret');

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET es obligatoria en produccion.');
}

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    const decode = jwt.verify(token, JWT_SECRET);
    const User = await db.Usuario.findOne({
      where: {
        id: decode.id,
      },
    });
    if (_.isEmpty(User)) {
      return res.status(404).json({ error: 'No autorizado.' });
    }

    // Cuenta deshabilitada por un administrador (inactiva o bloqueada)
    if (User.estado === USUARIO_ESTADO.INACTIVO
      || User.estado === USUARIO_ESTADO.BLOQUEADO) {
      return res.status(401).json({ error: 'Usuario deshabilitado. Acceso denegado.' });
    }

    // Cuenta aun sin activar (sin contrasena definida)
    if (User.estado === USUARIO_ESTADO.PENDIENTE_ACTIVACION) {
      return res.status(401).json({ error: 'La cuenta no ha sido activada. Revisa tu correo electronico.' });
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
      data.fundacionId = admin.fundacion_id;
    }
    req.User = data;
    return next();
  } catch (error) {
    console.log('ERROR in authenticateToken:', error);
    return res.status(401).json({ error: 'Token expirado o invalido' });
  }
};

module.exports = authenticateToken;

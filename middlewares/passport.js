const _ = require('lodash');
const jwt = require('jsonwebtoken');

const db = require('../DB/index');
const { ROL } = require('../constants');

const JWT_SECRET = 'secret';

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

    // Check if user is still enabled
    if (!User.habilitado) {
      return res.status(401).json({ error: 'Usuario deshabilitado. Acceso denegado.' });
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
    console.log('ERROR in authenticateToken:', error); // Modified log
    const responseError = {
      message: 'Token expirado',
      error: error.stack,
    };
    return res.status(401).json(responseError);
  }
};

module.exports = authenticateToken;

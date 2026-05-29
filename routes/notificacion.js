const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const notificacionController = require('../controllers/notificacionController');

// Middlewares
const passport = require('../middlewares/passport');
const { ROL } = require('../constants');

// Middleware de Autorización (Roles)
const checkRole = (rolesPermitidos) => (req, res, next) => {
  if (req.User && rolesPermitidos.includes(req.User.role)) {
    return next();
  }
  return res.status(403).json({ message: 'Acceso denegado: Permisos insuficientes' });
};

const router = express.Router();

// Ruta para que el Admin cree notificaciones para fundaciones
router.post(
  '/admin',
  passport,
  checkRole([ROL.ADMIN.ROL_ID]),
  AsyncWrapper(notificacionController.crearNotificacionAdmin),
);

// Ruta para que la Fundación vea sus notificaciones administrativas
router.get(
  '/fundacion',
  passport,
  checkRole([ROL.ADMIN_FUND.ROL_ID]),
  AsyncWrapper(notificacionController.getNotificacionesFundacion),
);

router.get(
  '/',
  passport,
  AsyncWrapper(notificacionController.getNotificaciones),
);

router.put(
  '/update/:notificacionId',
  passport,
  AsyncWrapper(notificacionController.updateNotificacion),
);

module.exports = router;

const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const donacionController = require('../controllers/donacionController');

// Middlewares
const passport = require('../middlewares/passport');
const validations = require('../controllers/validations');
const { ROL } = require('../constants');

const router = express.Router();
const checkRole = (roles) => (req, res, next) => {
  if (req.User && roles.includes(req.User.role)) return next();
  return res.status(403).json({ message: 'Acceso denegado: Permisos insuficientes' });
};

router.get('/', passport, checkRole([ROL.ADMIN_FUND.ROL_ID]), AsyncWrapper(donacionController.getDonaciones));

router.get(
  '/disponible',
  passport,
  checkRole([ROL.ADMIN_FUND.ROL_ID]),
  AsyncWrapper(donacionController.getDineroDisponible),
);

router.post(
  '/',
  passport,
  checkRole([ROL.DONADOR.ROL_ID]),
  validations.crearDonacion,
  AsyncWrapper(donacionController.crearDonacion),
);

router.put(
  '/:donacionId/aprobado',
  passport,
  checkRole([ROL.DONADOR.ROL_ID]),
  validations.aprobarDonacion,
  AsyncWrapper(donacionController.aprobarDonacion),
);

router.put(
  '/:donacionId/pagado',
  passport,
  checkRole([ROL.ADMIN.ROL_ID]),
  validations.pagarDonacion,
  AsyncWrapper(donacionController.pagarDonacion),
);

module.exports = router;

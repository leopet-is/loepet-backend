const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const donacionController = require('../controllers/donacionController');

// Middlewares
const passport = require('../middlewares/passport');
const validations = require('../controllers/validations');

const router = express.Router();

router.get('/', passport, AsyncWrapper(donacionController.getDonaciones));

router.get(
  '/disponible',
  passport,
  AsyncWrapper(donacionController.getDineroDisponible),
);

router.post(
  '/',
  passport,
  validations.crearDonacion,
  AsyncWrapper(donacionController.crearDonacion),
);

router.put(
  '/:donacionId/aprobado',
  passport,
  validations.aprobarDonacion,
  AsyncWrapper(donacionController.aprobarDonacion),
);

router.put(
  '/:donacionId/pagado',
  passport,
  validations.pagarDonacion,
  AsyncWrapper(donacionController.pagarDonacion),
);

module.exports = router;

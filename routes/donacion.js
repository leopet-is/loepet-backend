const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const donacionController = require('../controllers/donacionController');

// Middlewares
const passport = require('../middlewares/passport');

const router = express.Router();

router.get('/', passport, AsyncWrapper(donacionController.getDonaciones));

router.get(
  '/disponible',
  passport,
  AsyncWrapper(donacionController.getDineroDisponible),
);

router.post('/', passport, AsyncWrapper(donacionController.crearDonacion));

router.put(
  '/:donacionId/aprobado',
  passport,
  AsyncWrapper(donacionController.aprobarDonacion),
);

router.put(
  '/:donacionId/pagado',
  passport,
  AsyncWrapper(donacionController.pagarDonacion),
);

module.exports = router;

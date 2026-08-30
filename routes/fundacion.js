const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const fundacionController = require('../controllers/fundacionController');

// Middlewares
const passport = require('../middlewares/passport');
const validations = require('../controllers/validations');

const router = express.Router();

router.post('/', passport, validations.createFundacion, AsyncWrapper(fundacionController.createFundacion));

router.get('/', passport, AsyncWrapper(fundacionController.getFundaciones));

router.get(
  '/animales',
  passport,
  AsyncWrapper(fundacionController.getAnimalFundaciones),
);

router.get(
  '/padrinos/:fundacionId',
  AsyncWrapper(fundacionController.getAnimalPadrinosFundacion),
);

router.get(
  '/padrinos/calificacion/:fundacionId',
  AsyncWrapper(fundacionController.getAnimalPadrinosCalificacion),
);

router.put(
  '/:fundacionId',
  passport,
  validations.fundacionParam,
  validations.updateInfoFundacion,
  AsyncWrapper(fundacionController.updateInfoFundacion),
);

router.delete(
  '/:fundacionId',
  passport,
  AsyncWrapper(fundacionController.deleteFundacion),
);

module.exports = router;

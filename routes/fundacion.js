const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const fundacionController = require('../controllers/fundacionController');

// Middlewares
const passport = require('../middlewares/passport');
// Const validations = require("../controllers/validations");

const router = express.Router();

router.post('/', passport, AsyncWrapper(fundacionController.createFundacion));

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
  AsyncWrapper(fundacionController.updateInfoFundacion),
);

router.delete(
  '/:fundacionId',
  passport,
  AsyncWrapper(fundacionController.deleteFundacion),
);

module.exports = router;

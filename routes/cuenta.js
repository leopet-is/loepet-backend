const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const cuentaController = require('../controllers/cuentaController');

// Middlewares
const passport = require('../middlewares/passport');
const validations = require('../controllers/validations');

const router = express.Router();

router.get(
  '/fundacion/:fundacionId',
  passport,
  validations.cuentaInfo,
  AsyncWrapper(cuentaController.getCuentaBancaria),
);

router.get(
  '/fundacion/:fundacionId/principal',
  passport,
  validations.cuentaInfo,
  AsyncWrapper(cuentaController.getCuentaBancariaPrincipal),
);

router.get(
  '/fundacion/:fundacionId/all',
  passport,
  validations.cuentaInfo,
  AsyncWrapper(cuentaController.getAllCuentaBancaria),
);

router.post(
  '/',
  passport,
  validations.createCuentaBancaria,
  AsyncWrapper(cuentaController.crearCuentaBancaria),
);

router.put(
  '/fundacion/:fundacionId',
  passport,
  validations.updateCuentaBancaria,
  AsyncWrapper(cuentaController.updateCuentaBancaria),
);

router.put(
  '/fundacion/:fundacionId/principal',
  passport,
  validations.updateCuentaBancaria,
  AsyncWrapper(cuentaController.updateCuentaPrincipal),
);

router.put(
  '/:cuentaId',
  passport,
  validations.updateCuentaBancaria,
  AsyncWrapper(cuentaController.updateCuentaBancariaIDCuenta),
);

router.delete(
  '/:cuentaId',
  passport,
  validations.updateCuentaBancaria,
  AsyncWrapper(cuentaController.deleteCuenta),
);

module.exports = router;

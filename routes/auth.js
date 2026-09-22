const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const loginController = require('../controllers/loginController');
const authController = require('../controllers/authController');

// Middlewares
const validations = require('../controllers/validations');

const router = express.Router();

router.post('/login', validations.login, AsyncWrapper(loginController.login));
router.post('/register', validations.register, AsyncWrapper(loginController.register));

// Activacion de cuentas de fundacion (publico)
router.get(
  '/validar-token-activacion',
  validations.validarTokenActivacion,
  AsyncWrapper(authController.validarTokenActivacion),
);
router.post(
  '/activar-cuenta',
  validations.activarCuenta,
  AsyncWrapper(authController.activarCuenta),
);

module.exports = router;

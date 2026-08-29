const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const comisionController = require('../controllers/comisionController');

// Middlewares
const passport = require('../middlewares/passport');
// Const validations = require("../controllers/validations");

const router = express.Router();

router.post(
  '/',
  passport,
  AsyncWrapper(comisionController.crearComision),
);

router.get(
  '/fundacion',
  passport,
  AsyncWrapper(comisionController.getComisionesPorFundacion),
);

module.exports = router;

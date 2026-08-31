const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const evidenciaController = require('../controllers/evidenciaController');

// Middlewares
const passport = require('../middlewares/passport');
const validations = require('../controllers/validations');

const router = express.Router();

router.post(
  '/',
  passport,
  validations.crearEvidencia,
  AsyncWrapper(evidenciaController.crearEvidencia),
);

router.put(
  '/:evidenciaId',
  passport,
  validations.updateEvidencia,
  AsyncWrapper(evidenciaController.updateEvidencia),
);

module.exports = router;

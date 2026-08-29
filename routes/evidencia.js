const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const evidenciaController = require('../controllers/evidenciaController');

// Middlewares
const passport = require('../middlewares/passport');

const router = express.Router();

router.post('/', passport, AsyncWrapper(evidenciaController.crearEvidencia));

router.put(
  '/:evidenciaId',
  passport,
  AsyncWrapper(evidenciaController.updateEvidencia),
);

module.exports = router;

const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const favoritoController = require('../controllers/favoritoController');

// Validaciones
const validations = require('../controllers/validations');

// Middlewares
const passport = require('../middlewares/passport');

const router = express.Router();

// Agregar fundación a favoritos
router.post(
  '/',
  passport,
  validations.agregarFavorito,
  AsyncWrapper(favoritoController.agregarFavorito),
);

// Eliminar fundación de favoritos
router.delete(
  '/:fundacionId',
  passport,
  validations.favoritoUrl,
  AsyncWrapper(favoritoController.eliminarFavorito),
);

// Obtener lista de favoritos del usuario
router.get(
  '/',
  passport,
  AsyncWrapper(favoritoController.obtenerFavoritos),
);

// Verificar si una fundación es favorita
router.get(
  '/:fundacionId',
  passport,
  validations.favoritoUrl,
  AsyncWrapper(favoritoController.verificarFavorito),
);

module.exports = router;

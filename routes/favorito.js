const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const favoritoController = require('../controllers/favoritoController');

// Middlewares
const passport = require('../middlewares/passport');

const router = express.Router();

// Agregar fundación a favoritos
router.post(
  '/agregar/:fundacionId',
  passport,
  AsyncWrapper(favoritoController.agregarFavorito),
);

// Eliminar fundación de favoritos
router.delete(
  '/eliminar/:fundacionId',
  passport,
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
  '/verificar/:fundacionId',
  passport,
  AsyncWrapper(favoritoController.verificarFavorito),
);

module.exports = router;

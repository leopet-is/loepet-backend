const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const usuarioController = require('../controllers/usuarioController');

// Middlewares
const passport = require('../middlewares/passport');

const router = express.Router();

// Router.get("/:id", passport, AsyncWrapper(usuarioController.getInfo));
router.get('/all', passport, AsyncWrapper(usuarioController.getAllUsers));
router.put('/:id', passport, AsyncWrapper(usuarioController.updateInfo));
router.patch(
  '/update',
  passport,
  AsyncWrapper(usuarioController.updatePassword),
);

// Ruta para que un admin actualice el estado de un usuario
router.put('/status/:id', passport, AsyncWrapper(usuarioController.updateUserStatus));

module.exports = router;

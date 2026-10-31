const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const usuarioController = require('../controllers/usuarioController');

// Middlewares
const passport = require('../middlewares/passport');

const adminOnly = (req,res,next) => {
  if(req.User.role !== 1){
    return res.status(403).json({message: 'No tienes permiso para realizar esta accion'});
  }
  next();
}

const router = express.Router();

// Router.get("/:usuarioId", passport, AsyncWrapper(usuarioController.getInfo));
router.get('/', passport, AsyncWrapper(usuarioController.getAllUsers));
router.put('/:usuarioId', passport, AsyncWrapper(usuarioController.updateInfo));
router.patch(
  '/:usuarioId/password',
  passport,
  AsyncWrapper(usuarioController.updatePassword),
);

// Ruta para que un admin actualice el estado de un usuario
router.put(
  '/:usuarioId/status',
  passport,
  adminOnly,
  AsyncWrapper(usuarioController.updateUserStatus),
);

module.exports = router;

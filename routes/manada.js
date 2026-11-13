const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const manadaController = require('../controllers/manadaController');

// Middlewares
const passport = require('../middlewares/passport');
const validations = require('../controllers/validations');
const { ROL } = require('../constants');

const router = express.Router();

const checkDonador = (req, res, next) => {
  if (req.User && req.User.role === ROL.DONADOR.ROL_ID) return next();
  return res.status(403).json({ message: 'Acceso denegado: Permisos insuficientes' });
};

router.use(passport, checkDonador);

router.post('/', validations.createManada, AsyncWrapper(manadaController.createManada));

router.get('/', AsyncWrapper(manadaController.getManadas));

router.get('/search', validations.searchManada, AsyncWrapper(manadaController.searchManada));

router.post(
  '/:manadaId/animals',
  validations.addAnimalsManada,
  AsyncWrapper(manadaController.addAnimals),
);

router.get(
  '/:manadaId/animals',
  validations.manadaParam,
  AsyncWrapper(manadaController.getAnimalManadas),
);

router.delete(
  '/:manadaId/animals/:animalId',
  passport,
  validations.animalManadaParam,
  AsyncWrapper(manadaController.deleteAnimalManada),
);

router.put('/:manadaId', validations.updateManada, AsyncWrapper(manadaController.updateInfoManada));

router.delete('/:manadaId', validations.manadaParam, AsyncWrapper(manadaController.deleteManada));

module.exports = router;

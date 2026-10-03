const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const manadaController = require('../controllers/manadaController');

// Middlewares
const passport = require('../middlewares/passport');
const validations = require('../controllers/validations');

const router = express.Router();

router.post('/', passport, validations.createManada, AsyncWrapper(manadaController.createManada));

router.get('/', passport, AsyncWrapper(manadaController.getManadas));

router.get('/search', passport, validations.searchManada, AsyncWrapper(manadaController.searchManada));

router.post(
  '/:manadaId/animals',
  passport,
  validations.addAnimalsManada,
  AsyncWrapper(manadaController.addAnimals),
);

router.get(
  '/:manadaId/animals',
  passport,
  validations.manadaParam,
  AsyncWrapper(manadaController.getAnimalManadas),
);

router.delete(
  '/:manadaId/animals/:animalId',
  passport,
  validations.animalManadaParam,
  AsyncWrapper(manadaController.deleteAnimalManada),
);

router.put('/:manadaId', passport, validations.manadaParam, AsyncWrapper(manadaController.updateInfoManada));

router.delete('/:manadaId', passport, validations.manadaParam, AsyncWrapper(manadaController.deleteManada));

module.exports = router;

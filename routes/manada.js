const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const manadaController = require('../controllers/manadaController');

// Middlewares
const passport = require('../middlewares/passport');
// Const validations = require("../controllers/validations");

const router = express.Router();

router.post('/', passport, AsyncWrapper(manadaController.createManada));

router.get('/', passport, AsyncWrapper(manadaController.getManadas));

router.get('/search', passport, AsyncWrapper(manadaController.searchManada));

router.post(
  '/:manadaId/animals',
  passport,
  AsyncWrapper(manadaController.addAnimals),
);

router.get(
  '/:manadaId/animals',
  passport,
  AsyncWrapper(manadaController.getAnimalManadas),
);

router.delete(
  '/:manadaId/animals/:animalId',
  passport,
  AsyncWrapper(manadaController.deleteAnimalManada),
);

router.put('/:manadaId', passport, AsyncWrapper(manadaController.updateInfoManada));

router.delete('/:manadaId', passport, AsyncWrapper(manadaController.deleteManada));

module.exports = router;

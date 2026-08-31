const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const animalController = require('../controllers/animalController');

// Middlewares
const passport = require('../middlewares/passport');
const validations = require('../controllers/validations');

const router = express.Router();

router.get(
  '/',
  passport,
  validations.allAnimals,
  AsyncWrapper(animalController.getAllAnimals),
);

router.get(
  '/app',
  passport,
  validations.allAnimals,
  AsyncWrapper(animalController.getAllAnimalsApp),
);

router.get(
  '/app/fundacion/:fundacionId',
  passport,
  validations.fundacionParam,
  AsyncWrapper(animalController.getAllAnimalsFundacionApp),
);

router.get('/especies', passport, AsyncWrapper(animalController.getEspecies));

router.get('/search', passport, AsyncWrapper(animalController.searchAnimal));

router.get(
  '/:animalId',
  passport,
  validations.animal,
  AsyncWrapper(animalController.getAnimal),
);

router.post(
  '/',
  passport,
  validations.createAnimal,
  AsyncWrapper(animalController.createAnimal),
);

router.put(
  '/:animalId',
  passport,
  validations.updateAnimal,
  AsyncWrapper(animalController.updateAnimal),
);

router.delete(
  '/:animalId',
  passport,
  validations.animal,
  AsyncWrapper(animalController.deleteAnimal),
);

module.exports = router;

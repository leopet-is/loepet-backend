const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const actualizacionController = require('../controllers/actualizacionContoller');

// Middlewares
const passport = require('../middlewares/passport');
const validations = require('../controllers/validations');

const router = express.Router();

router.post(
  '/create',
  passport,
  AsyncWrapper(actualizacionController.createActualizacion),
);

router.get(
  '/',
  passport,
  AsyncWrapper(actualizacionController.getActualizaciones),
);

router.put(
  '/update/:actualizacionId',
  passport,
  AsyncWrapper(actualizacionController.updateActualizacion),
);

router.delete(
  '/delete/:actualizacionId',
  passport,
  AsyncWrapper(actualizacionController.deleteActualizacion),
);

router.post(
  '/create/rating',
  passport,
  validations.createRating,
  AsyncWrapper(actualizacionController.createRating),
);

router.post(
  '/load/rating',
  passport,
  AsyncWrapper(actualizacionController.loadRating),
);
module.exports = router;

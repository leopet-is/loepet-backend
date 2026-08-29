const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const actualizacionController = require('../controllers/actualizacionContoller');

// Middlewares
const passport = require('../middlewares/passport');
const validations = require('../controllers/validations');

const router = express.Router();

router.post(
  '/',
  passport,
  AsyncWrapper(actualizacionController.createActualizacion),
);

router.get(
  '/',
  passport,
  AsyncWrapper(actualizacionController.getActualizaciones),
);

router.post(
  '/:actualizacionId/ratings',
  passport,
  validations.createRating,
  AsyncWrapper(actualizacionController.createRating),
);

router.get(
  '/:actualizacionId/ratings',
  passport,
  AsyncWrapper(actualizacionController.loadRating),
);

router.put(
  '/:actualizacionId',
  passport,
  AsyncWrapper(actualizacionController.updateActualizacion),
);

router.delete(
  '/:actualizacionId',
  passport,
  AsyncWrapper(actualizacionController.deleteActualizacion),
);

module.exports = router;

const express = require('express');

const router = express.Router();

const { AsyncWrapper } = require('../helpers');
const validations = require('../controllers/validations');
const SolicitudesFundacionController = require('../controllers/solicitudesFundacionController');

// Ruta pública para crear una nueva solicitud de fundación
router.post(
  '/solicitudes',
  validations.createSolicitudFundacion,
  AsyncWrapper(SolicitudesFundacionController.createSolicitudFundacion),
);

module.exports = router;

const express = require('express');

const router = express.Router();

const SolicitudesFundacionController = require('../controllers/solicitudesFundacionController');

// Ruta pública para crear una nueva solicitud de fundación
router.post('/solicitudes', SolicitudesFundacionController.createSolicitudFundacion);

module.exports = router;

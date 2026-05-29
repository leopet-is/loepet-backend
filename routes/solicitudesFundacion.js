const express = require('express');

const router = express.Router();
const passport = require('../middlewares/passport');

const SolicitudesFundacionController = require('../controllers/solicitudesFundacionController');

// Todas las rutas de administración deben estar protegidas
router.use(passport);

// Rutas para la gestión de solicitudes de fundaciones
router.get('/solicitudes/ready-for-creation', SolicitudesFundacionController.getSolicitudesReadyForCreation);
router.get('/solicitudes', SolicitudesFundacionController.getAllSolicitudesFundacion);
router.get('/solicitudes/:solicitudId', SolicitudesFundacionController.getSolicitudFundacion);
router.put('/solicitudes/:solicitudId/aprobar', SolicitudesFundacionController.aprobarSolicitudFundacion);
router.put('/solicitudes/:solicitudId/rechazar', SolicitudesFundacionController.rechazarSolicitudFundacion);

module.exports = router;

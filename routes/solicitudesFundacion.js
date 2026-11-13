const express = require('express');

const router = express.Router();
const passport = require('../middlewares/passport');
const { ROL } = require('../constants');

const SolicitudesFundacionController = require('../controllers/solicitudesFundacionController');

// Todas las rutas de administración deben estar protegidas
router.use(passport);
router.use((req, res, next) => {
  if (req.User && req.User.role === ROL.ADMIN.ROL_ID) return next();
  return res.status(403).json({ message: 'Acceso denegado: Permisos insuficientes' });
});

// Rutas para la gestión de solicitudes de fundaciones
router.get('/solicitudes/ready-for-creation', SolicitudesFundacionController.getSolicitudesReadyForCreation);
router.get('/solicitudes', SolicitudesFundacionController.getAllSolicitudesFundacion);
router.get('/solicitudes/:solicitudId', SolicitudesFundacionController.getSolicitudFundacion);
router.put('/solicitudes/:solicitudId/aprobar', SolicitudesFundacionController.aprobarSolicitudFundacion);
router.put('/solicitudes/:solicitudId/rechazar', SolicitudesFundacionController.rechazarSolicitudFundacion);

module.exports = router;

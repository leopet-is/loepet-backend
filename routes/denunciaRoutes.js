const express = require('express');
const multer = require('multer');

const router = express.Router();
// El middleware se llama passport.js pero exporta una función authenticateToken custom,
// no usa la librería passport
const auth = require('../middlewares/passport');
const { ROL } = require('../constants');

// Importar controladores
const denunciaController = require('../controllers/denunciaController');
const reportController = require('../controllers/reportController');

const upload = multer({ dest: 'tempFiles/' });

// Middleware de Autorización (Roles)
const checkRole = (rolesPermitidos) => (req, res, next) => {
  if (req.User && rolesPermitidos.includes(req.User.role)) {
    return next();
  }
  return res.status(403).json({ message: 'Acceso denegado: Permisos insuficientes' });
};

// --- DEFINICIÓN DE RUTAS ---

// POST /denuncias - Solo Donadores pueden crear denuncias
router.post(
  '/',
  auth,
  checkRole([ROL.DONADOR.ROL_ID]),
  upload.array('archivos', 5), // Permitir hasta 5 archivos
  denunciaController.crearDenuncia,
);

// GET /denuncias/agrupadas - Solo Admin puede ver el reporte agrupado
router.get(
  '/agrupadas',
  auth,
  checkRole([ROL.ADMIN.ROL_ID]),
  reportController.obtenerDenunciasPorFundacion,
);

// PUT /denuncias/:denunciaId - Solo Admin puede rechazar denuncias
router.put(
  '/:denunciaId',
  auth,
  checkRole([ROL.ADMIN.ROL_ID]),
  denunciaController.rechazarDenuncia,
);

module.exports = router;

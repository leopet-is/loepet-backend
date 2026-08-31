const multer = require('multer');
const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const amazonS3 = require('../controllers/uploadController');

// Middlewares
const passport = require('../middlewares/passport');
const { esMimePermitido } = require('../utils/mimeValidator');

const router = express.Router();

const NUMERO_FOTOS = 5;
const TAMANO_MAXIMO = 10 * 1024 * 1024; // 10 MB por archivo

const upload = multer({
  dest: 'tempFiles/',
  limits: { fileSize: TAMANO_MAXIMO },
  fileFilter: (req, file, cb) => {
    if (esMimePermitido(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error(
      'Tipo de archivo no permitido. Solo se admiten imagenes (JPG, PNG, GIF, WEBP), PDF y MP4',
    ));
  },
});

/* Middleware que transforma los errores de multer (tipo de archivo no permitido
 * o archivo demasiado grande) en una respuesta 400 con el formato del proyecto,
 * en lugar de propagarlos como error 500. */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      status: 'fail',
      errors: [{
        campo: 'file',
        mensaje: `El archivo excede el tamano maximo de ${TAMANO_MAXIMO / (1024 * 1024)} MB`,
      }],
    });
  }
  if (err.message && err.message.startsWith('Tipo de archivo no permitido')) {
    return res.status(400).json({
      status: 'fail',
      errors: [{ campo: 'file', mensaje: err.message }],
    });
  }
  return next(err);
};

router.post(
  '/uploadFile',
  passport,
  upload.array('file', NUMERO_FOTOS),
  handleMulterError,
  AsyncWrapper(amazonS3.uploadFile),
);

router.post(
  '/deleteFile',
  AsyncWrapper(amazonS3.deleteFile),
);

module.exports = router;

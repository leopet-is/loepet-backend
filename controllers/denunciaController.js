const fs = require('fs');
const db = require('../DB/index');

// Cambiar entre S3 y LocalStorage según configuración
const USE_LOCAL_STORAGE = process.env.USE_LOCAL_STORAGE === 'true';
const storage = USE_LOCAL_STORAGE
  ? require('../lib/Storage/LocalStorage')
  : require('../lib/Storage/S3');

exports.crearDenuncia = async (req, res) => {
  try {
    const { fundacionId, motivo } = req.body;
    // Asumimos que passport popula req.User (nota: en passport.js vi req.User = data)
    const usuarioId = req.User.id;

    if (!fundacionId || !motivo) {
      return res.status(400).json({ ok: false, message: 'Faltan datos requeridos' });
    }

    const archivosUrls = [];
    if (req.files && req.files.length > 0) {
      await Promise.all(req.files.map(async (file) => {
        const { path: filePath, originalname: fileName } = file;
        try {
          const location = await storage.updateFile(fileName, filePath, {
            Bucket: process.env.S3_BUCKET,
          });
          archivosUrls.push(location);
        } catch (err) {
          console.error('Error subiendo archivo:', err);
        } finally {
          // Eliminar archivo temporal
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }));
    }

    const nuevaDenuncia = await db.Denuncia.create({
      usuarioId,
      fundacionId,
      motivo,
      estado: 'pendiente',
      archivos: archivosUrls.length > 0 ? archivosUrls : null,
    });

    return res.status(201).json({ ok: true, data: nuevaDenuncia });
  } catch (error) {
    console.error('Error creando denuncia:', error);
    return res.status(500).json({ ok: false, message: 'Error interno' });
  }
};

exports.rechazarDenuncia = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo_rechazo: motivoRechazo } = req.body;

    const denuncia = await db.Denuncia.findByPk(id);
    if (!denuncia) {
      return res.status(404).json({ ok: false, message: 'Denuncia no encontrada' });
    }

    denuncia.estado = 'rechazada';
    denuncia.motivo_rechazo = motivoRechazo;
    await denuncia.save();

    return res.status(200).json({ ok: true, message: 'Denuncia rechazada correctamente' });
  } catch (error) {
    console.error('Error rechazando denuncia:', error);
    return res.status(500).json({ ok: false, message: 'Error interno' });
  }
};

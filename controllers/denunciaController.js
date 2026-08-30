const fs = require('fs');
const db = require('../DB/index');
const storage = require('../services/storage');

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
          const location = await storage.updateFile(fileName, filePath);
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
    const { denunciaId } = req.params;
    const { motivo_rechazo: motivoRechazo } = req.body;

    const denuncia = await db.Denuncia.findByPk(denunciaId);
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

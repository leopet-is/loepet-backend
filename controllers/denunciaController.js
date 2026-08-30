const fs = require('fs');
const db = require('../DB/index');
const storage = require('../services/storage');

/**
 * @openapi
 * tags:
 *   - name: Denuncias
 *
 * /denuncias:
 *   post:
 *     tags: [Denuncias]
 *     security:
 *       - bearerAuth: []
 *     summary: Crea una denuncia contra una fundacion (rol donador)
 *     description: Se envian como formulario multipart con hasta 5 archivos de evidencia.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [fundacionId, motivo]
 *             properties:
 *               fundacionId:
 *                 type: integer
 *                 description: Id de la fundacion denunciada
 *               motivo:
 *                 type: string
 *                 description: Motivo de la denuncia
 *               archivos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Hasta 5 archivos de evidencia
 *     responses:
 *       '201':
 *         description: Denuncia creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Denuncia' }
 *       '400':
 *         description: Faltan datos requeridos
 *       '403':
 *         description: Acceso denegado (permisos insuficientes)
 *       '500':
 *         description: Error interno del servidor
 */
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

/**
 * @openapi
 * /denuncias/{denunciaId}:
 *   put:
 *     tags: [Denuncias]
 *     security:
 *       - bearerAuth: []
 *     summary: Rechaza una denuncia indicando el motivo (rol administrador de plataforma)
 *     parameters:
 *       - in: path
 *         name: denunciaId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [motivo_rechazo]
 *             properties:
 *               motivo_rechazo: { type: string }
 *     responses:
 *       '200':
 *         description: Denuncia rechazada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 message: { type: string }
 *       '404':
 *         description: Denuncia no encontrada
 *       '403':
 *         description: Acceso denegado (permisos insuficientes)
 *       '500':
 *         description: Error interno del servidor
 */
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

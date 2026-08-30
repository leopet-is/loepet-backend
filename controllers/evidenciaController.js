/* eslint-disable no-console */

const _ = require('lodash');
const { validateAdminFund } = require('./helpers');

const db = require('../DB/index');

/**
 * @openapi
 * tags:
 *   - name: Evidencias
 *
 * /evidencia:
 *   post:
 *     tags: [Evidencias]
 *     security:
 *       - bearerAuth: []
 *     summary: Crea la evidencia de una donacion (rol administrador de fundacion)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [donacion, descripcion]
 *             properties:
 *               donacion: { type: integer, description: Id de la donacion }
 *               descripcion: { type: string }
 *               galeria:
 *                 type: object
 *                 description: Objeto con arreglo de fotos
 *                 example: { fotos: ['https://cdn.leopet.app/evidencias/1.jpg'] }
 *     responses:
 *       '200':
 *         description: Evidencia creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string }
 *                 result: { $ref: '#/components/schemas/Evidencia' }
 *       '401':
 *         description: No autorizado para realizar la operacion
 *       '500':
 *         description: Error interno del servidor
 *
 * /evidencia/{evidenciaId}:
 *   put:
 *     tags: [Evidencias]
 *     security:
 *       - bearerAuth: []
 *     summary: Actualiza la informacion de una evidencia (rol administrador de fundacion)
 *     parameters:
 *       - in: path
 *         name: evidenciaId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descripcion: { type: string }
 *               galeria:
 *                 type: object
 *                 example: { fotos: ['https://cdn.leopet.app/evidencias/1.jpg'] }
 *     responses:
 *       '200':
 *         description: Informacion de la evidencia actualizada
 *       '401':
 *         description: No autorizado para realizar la operacion
 *       '500':
 *         description: Error interno del servidor
 */

/**
 * Funcion para crear la evidencia de una donacion por parte del administrador de fundacion
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.crearEvidencia = async (req, res) => {
  try {
    const { User } = req;
    const { donacion, descripcion, galeria } = req.body;

    if (!(await validateAdminFund(User.id))) {
      return res
        .status(401)
        .send({ error: 'No esta autorizado para realizar esta operacion!' });
    }
    const animal = await db.Evidencia.create({
      donacion_id: donacion,
      descripcion,
      galeria,
    });
    const response = {
      mensaje: 'Historia creado exitosamente.',
      result: animal,
    };

    return res.send(response);
  } catch (error) {
    console.log('ERROR', error);
    const responseError = {
      message: 'Something bad happened!',
      error: error.stack,
    };
    return res.status(500).send(JSON.stringify(responseError));
  }
};

/**
 * Funcion para actualizar la informacion de una evidencia por parte del administrador de fundacion
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.updateEvidencia = async (req, res) => {
  try {
    const { evidenciaId } = req.params;
    const { User } = req;
    const { descripcion, galeria } = req.body;
    if (!(await validateAdminFund(User.id))) {
      return res
        .status(401)
        .send({ error: 'No esta autorizado para realizar esta operacion!' });
    }
    const update = {
      ...(!_.isEmpty(descripcion) ? { descripcion } : {}),
      ...(!_.isEmpty(galeria) ? { galeria } : {}),
      updatedAt: Date.now(),
    };
    const evidencia = await db.Evidencia.update(update, {
      where: { id: evidenciaId },
    });

    const response = {
      mensaje: 'Informacion actualizada exitosamente.',
      result: evidencia,
    };
    return res.send(response);
  } catch (error) {
    console.log('ERROR', error);
    const responseError = {
      message: 'Something bad happened!',
      error: error.stack,
    };
    return res.status(500).send(JSON.stringify(responseError));
  }
};

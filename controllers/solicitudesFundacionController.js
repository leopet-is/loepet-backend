const _ = require('lodash');
const { Op } = require('sequelize');

const { validateRequest } = require('../helpers');
const db = require('../DB/index');
const { SOLICITUD_FUNDACION_ESTADO } = require('../constants');

/**
 * @openapi
 * tags:
 *   - name: Solicitudes de fundacion
 *
 * /public/solicitudes:
 *   post:
 *     tags: [Solicitudes de fundacion]
 *     summary: Envia una solicitud de fundacion desde el landing page (publico)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ruc, nombre, direccion, email_contacto, cedula_contacto, nombre_contacto, apellido_contacto]
 *             properties:
 *               ruc: { type: string, description: 'RUC de 13 digitos con digito verificador SRI valido', pattern: '^\\d{13}$', example: '1710034065001' }
 *               nombre: { type: string, example: 'Fundacion Patitas' }
 *               direccion: { type: string, example: 'Quito, Ecuador' }
 *               telefono: { type: string, description: 'Movil 09XXXXXXXX o fijo 0[2-7]XXXXXXX', example: '0987654321' }
 *               email_contacto: { type: string, format: email }
 *               cedula_contacto: { type: string, description: 'Cedula ecuatoriana de 10 digitos valida', pattern: '^\\d{10}$', example: '1710034065' }
 *               nombre_contacto: { type: string }
 *               apellido_contacto: { type: string }
 *               comentarios: { type: string }
 *     responses:
 *       '200':
 *         description: Solicitud de fundacion enviada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string }
 *                 result: { $ref: '#/components/schemas/SolicitudFundacion' }
 *       '409':
 *         description: Ya existe una solicitud registrada con ese RUC o correo, o el RUC ya pertenece a una fundacion registrada
 *       '422':
 *         description: Campos requeridos invalidos o faltantes (RUC/cedula con digito verificador incorrecto, telefono o email con formato no valido)
 *       '500':
 *         description: Error interno del servidor
 *
 * /admin/solicitudes:
 *   get:
 *     tags: [Solicitudes de fundacion]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtiene las solicitudes de fundacion con paginacion (rol administrador)
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Busqueda por nombre de fundacion o de la persona de contacto
 *       - in: query
 *         name: estado
 *         schema: { type: string, enum: [pendiente, aprobada, rechazada] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       '200':
 *         description: Lista paginada de solicitudes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Paginacion'
 *       '500':
 *         description: Error interno del servidor
 *
 * /admin/solicitudes/ready-for-creation:
 *   get:
 *     tags: [Solicitudes de fundacion]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtiene solicitudes aprobadas que estan listas para crear el usuario/fundacion
 *     responses:
 *       '200':
 *         description: Arreglo de solicitudes listas para creacion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/SolicitudFundacion' }
 *       '500':
 *         description: Error interno del servidor
 *
 * /admin/solicitudes/{solicitudId}:
 *   get:
 *     tags: [Solicitudes de fundacion]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtiene los detalles de una solicitud
 *     parameters:
 *       - in: path
 *         name: solicitudId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200':
 *         description: Detalle de la solicitud
 *       '404':
 *         description: Solicitud no encontrada
 *       '500':
 *         description: Error interno del servidor
 *
 * /admin/solicitudes/{solicitudId}/aprobar:
 *   put:
 *     tags: [Solicitudes de fundacion]
 *     security:
 *       - bearerAuth: []
 *     summary: Aprueba una solicitud (la deja lista para crear usuario/fundacion)
 *     parameters:
 *       - in: path
 *         name: solicitudId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200':
 *         description: Solicitud aprobada exitosamente
 *       '404':
 *         description: Solicitud no encontrada
 *       '500':
 *         description: Error interno del servidor
 *
 * /admin/solicitudes/{solicitudId}/rechazar:
 *   put:
 *     tags: [Solicitudes de fundacion]
 *     security:
 *       - bearerAuth: []
 *     summary: Rechaza una solicitud indicando el motivo en notas
 *     parameters:
 *       - in: path
 *         name: solicitudId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RechazarSolicitudRequest'
 *     responses:
 *       '200':
 *         description: Solicitud rechazada exitosamente
 *       '400':
 *         description: El motivo del rechazo es requerido
 *       '404':
 *         description: Solicitud no encontrada
 *       '500':
 *         description: Error interno del servidor
 */

/**
 * Funcion para crear una solicitud de fundacion desde el Landing Page
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.createSolicitudFundacion = async (req, res) => {
  await validateRequest(req);
  try {
    const {
      ruc,
      nombre,
      direccion,
      telefono,
      email_contacto: emailContacto,
      nombre_contacto: nombreContacto,
      apellido_contacto: apellidoContacto,
      cedula_contacto: cedulaContacto,
      comentarios,
    } = req.body;

    const emailNormalizado = _.trim(_.toLower(emailContacto));
    const rucNormalizado = _.trim(String(ruc));

    // Validar si ya existe una solicitud con el mismo RUC o email de contacto
    const existingSolicitud = await db.SolicitudFundacion.findOne({
      where: {
        [Op.or]: [{ ruc: rucNormalizado }, { email_contacto: emailNormalizado }],
      },
    });

    if (existingSolicitud) {
      return res.status(409).send({
        error: 'Ya existe una solicitud registrada con este RUC o correo electrónico.',
      });
    }

    // Verificar si el RUC ya corresponde a una fundacion registrada
    const existingFundacion = await db.Fundacion.findOne({
      where: { ruc: rucNormalizado },
    });

    if (existingFundacion) {
      return res.status(409).send({
        error: 'Ya se encuentra registrada una fundación con este RUC.',
      });
    }

    const solicitud = await db.SolicitudFundacion.create({
      ruc: rucNormalizado,
      nombre,
      direccion,
      telefono,
      email_contacto: emailNormalizado,
      nombre_contacto: nombreContacto,
      apellido_contacto: apellidoContacto,
      cedula_contacto: cedulaContacto,
      comentarios,
      estado: SOLICITUD_FUNDACION_ESTADO.PENDIENTE, // Estado inicial
    });

    const response = {
      mensaje: 'Solicitud de fundación enviada exitosamente.',
      result: solicitud,
    };
    return res.send(response);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).send({
        error: 'Ya existe una solicitud registrada con este RUC o correo electrónico.',
      });
    }
    if (error.name === 'SequelizeValidationError') {
      const messages = _.map(error.errors, 'message');
      return res.status(400).send({ error: messages });
    }
    console.log('ERROR', error);
    const responseError = {
      message: 'Something bad happened!',
      error: error.stack,
    };
    return res.status(500).send(JSON.stringify(responseError));
  }
};

/**
 * Funcion para obtener todas las solicitudes de fundacion (para el administrador)
 * Permite filtrar por estado y buscar por nombre de fundacion o contacto.
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.getAllSolicitudesFundacion = async (req, res) => {
  await validateRequest(req);
  try {
    const { q, estado } = req.query;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);

    const where = {};

    if (estado) {
      where.estado = estado;
    }

    if (q) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${q}%` } },
        { nombre_contacto: { [Op.like]: `%${q}%` } },
        { apellido_contacto: { [Op.like]: `%${q}%` } },
      ];
    }

    const { count, rows: solicitudes } = await db.SolicitudFundacion.findAndCountAll({
      where,
      offset: (page - 1) * limit,
      limit,
      order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(count / limit);

    const response = {
      limit,
      page,
      totalPages,
      total: count,
      result: solicitudes,
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
 * Funcion para aprobar una solicitud de fundacion
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.aprobarSolicitudFundacion = async (req, res) => {
  await validateRequest(req);
  try {
    const { solicitudId } = req.params;

    const solicitud = await db.SolicitudFundacion.findOne({
      where: { id: solicitudId },
    });

    if (_.isEmpty(solicitud)) {
      return res.status(404).send({ error: 'Solicitud no encontrada.' });
    }

    const update = {
      estado: SOLICITUD_FUNDACION_ESTADO.APROBADA,
      notas_admin: 'Solicitud aprobada. Pendiente creación de usuario.',
      ready_for_creation: true,
      updatedAt: Date.now(),
    };

    await db.SolicitudFundacion.update(update, {
      where: { id: solicitudId },
    });

    const updatedSolicitud = await db.SolicitudFundacion.findOne({
      where: { id: solicitudId },
    });

    const response = {
      mensaje: 'Solicitud aprobada exitosamente.',
      result: updatedSolicitud,
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
 * Funcion para rechazar una solicitud de fundacion
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.rechazarSolicitudFundacion = async (req, res) => {
  await validateRequest(req);
  try {
    const { solicitudId } = req.params;
    const { notas_admin: notasAdmin } = req.body;

    if (!notasAdmin) {
      return res.status(400).send({ error: 'El motivo del rechazo es requerido en las notas.' });
    }

    const solicitud = await db.SolicitudFundacion.findOne({
      where: { id: solicitudId },
    });

    if (_.isEmpty(solicitud)) {
      return res.status(404).send({ error: 'Solicitud no encontrada.' });
    }

    const update = {
      estado: SOLICITUD_FUNDACION_ESTADO.RECHAZADA,
      notas_admin: notasAdmin,
      updatedAt: Date.now(),
    };

    await db.SolicitudFundacion.update(update, {
      where: { id: solicitudId },
    });

    const updatedSolicitud = await db.SolicitudFundacion.findOne({
      where: { id: solicitudId },
    });

    const response = {
      mensaje: 'Solicitud rechazada exitosamente.',
      result: updatedSolicitud,
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
 * Funcion para obtener solicitudes de fundacion listas para la creacion de usuario
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.getSolicitudesReadyForCreation = async (req, res) => {
  await validateRequest(req);
  try {
    const solicitudes = await db.SolicitudFundacion.findAll({
      where: {
        estado: SOLICITUD_FUNDACION_ESTADO.APROBADA,
        ready_for_creation: true,
      },
      order: [['createdAt', 'ASC']],
    });

    const response = {
      result: solicitudes,
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
 * Funcion para obtener los detalles de una sola solicitud de fundacion
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.getSolicitudFundacion = async (req, res) => {
  await validateRequest(req);
  try {
    const { solicitudId } = req.params;

    const solicitud = await db.SolicitudFundacion.findOne({
      where: { id: solicitudId },
    });

    if (_.isEmpty(solicitud)) {
      return res.status(404).send({ error: 'Solicitud no encontrada.' });
    }

    const response = {
      result: solicitud,
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

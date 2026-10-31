/* eslint-disable no-await-in-loop, no-console */

const _ = require('lodash');
const dayjs = require('dayjs');
const { Op } = require('sequelize');

const { getActualizacionesAnimal } = require('./helpers');
const { createPlanManada } = require('./helpersPayPal');

const db = require('../DB/index');

/**
 * @openapi
 * tags:
 *   - name: Donaciones
 *
 * /donacion:
 *   get:
 *     tags: [Donaciones]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtiene las donaciones de una fundacion con paginacion (rol admin de fundacion)
 *     description: Cada donacion incluye las actualizaciones visibles del animal donado.
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Busqueda por nombre del animal
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       '200':
 *         description: Lista paginada de donaciones con donador, animal y evidencia
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 limit: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 *                 total: { type: integer }
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       donador: { type: string }
 *                       animal: { type: string }
 *                       dinero: { type: number }
 *                       status: { type: boolean, description: Campo aprobado de la donacion }
 *                       fecha: { type: string }
 *                       actualizaciones: { type: array }
 *       '500':
 *         description: Error interno del servidor
 *   post:
 *     tags: [Donaciones]
 *     security:
 *       - bearerAuth: []
 *     summary: Crea una donacion para una manada (rol donador)
 *     description: Retorna el link de pago (PayPal) generado para la donacion. En pruebas sin credenciales PayPal se usa un mock.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DonacionRequest'
 *     responses:
 *       '200':
 *         description: Donacion realizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 result: { type: object, description: Link o respuesta del plan de pago }
 *       '500':
 *         description: Error interno del servidor
 *
 * /donacion/disponible:
 *   get:
 *     tags: [Donaciones]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtiene el dinero disponible de una fundacion (rol admin de fundacion)
 *     description: Suma de donaciones aprobadas y no pagadas de los animales de la fundacion.
 *     responses:
 *       '200':
 *         description: Monto disponible
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result: { type: number }
 *       '500':
 *         description: Error interno del servidor
 *
 * /donacion/{donacionId}/aprobado:
 *   put:
 *     tags: [Donaciones]
 *     security:
 *       - bearerAuth: []
 *     summary: Aprueba o rechaza la evidencia de una donacion (rol donador)
 *     parameters:
 *       - in: path
 *         name: donacionId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [aprobado]
 *             properties:
 *               aprobado: { type: boolean, example: true }
 *     responses:
 *       '200':
 *         description: Donacion actualizada
 *       '500':
 *         description: Error interno del servidor
 *
 * /donacion/{donacionId}/pagado:
 *   put:
 *     tags: [Donaciones]
 *     security:
 *       - bearerAuth: []
 *     summary: Actualiza el estado de pago de una donacion (rol admin de plataforma)
 *     parameters:
 *       - in: path
 *         name: donacionId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [success, failed]
 *                 example: success
 *     responses:
 *       '200':
 *         description: Donacion actualizada
 *       '500':
 *         description: Error interno del servidor
 */

/**
 * Funcion para obtener todas las donaciones
 * @param  {*} req
 * @param  {*} res
 * @return  {Object} response
 */
exports.getDonaciones = async (req, res) => {
  try {
    const { User } = req;
    const { q } = req.query;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '1', 10);
    const query = {
      include: [
        {
          model: db.Animal,
          required: true,
          where: {
            fundacion_id: User.fundacionId,
            ...(!_.isEmpty(q) ? { nombre: { [Op.regexp]: q } } : {}),
          },
        },
        {
          model: db.Usuario,
          required: true,
        },
      ],
      offset: (page - 1) * limit,
      limit,
    };
    const responseBody = await db.Donacion.findAndCountAll(query);
    const { rows, count } = responseBody;
    const totalPages = Math.ceil(count / limit);
    const result = await Promise.all(rows.map(async (row) => {
      const id = _.get(row, 'id');
      const animalId = _.get(row, 'Animal.id');
      const actualizaciones = await getActualizacionesAnimal(animalId);
      return {
        id,
        donador: `${_.get(row, 'Usuario.apellidos')} ${_.get(
          row,
          'Usuario.nombres',
        )}`,
        animal: _.get(row, 'Animal.nombre'),
        dinero: _.get(row, 'monto'),
        status: _.get(row, 'aprobado'),
        fecha: dayjs(_.get(row, 'createdAt')).format('DD/MM/YYYY HH:mm:ss'),
        actualizaciones,
      };
    }));
    const response = {
      limit,
      page,
      totalPages,
      total: count,
      result,
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
 * Funcion para obtener el dinero disponible de una fundacion
 * @param  {*} req
 * @param  {*} res
 * @return  {Object} response
 */
exports.getDineroDisponible = async (req, res) => {
  try {
    const { User } = req;
    const query = {
      where: {
        pagado: false,
        aprobado: true,
      },
      include: [
        {
          model: db.Animal,
          required: true,
          where: {
            fundacion_id: User.fundacionId,
          },
        },
      ],
    };
    const responseBody = await db.Donacion.findAndCountAll(query);
    const { rows } = responseBody;
    const monto = rows.reduce((acc, row) => {
      const total = _.toNumber(_.get(row, 'monto', 0));
      return acc + total;
    }, 0);

    const response = {
      result: monto,
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
 * Funcion para crear una donacion en la BD
 * @param  {*} req
 * @param  {*} res
 * @return  {Object} response
 */
exports.crearDonacion = async (req, res) => {
  try {
    const { manadaId } = req.body;
    const manada = await db.Manada.findOne({
      where: {
        id: manadaId,
      },
      include: [
        {
          model: db.Usuario,
          required: true,
        },
        {
          model: db.SuscripcionPadrino,
          as: 'suscripcionPadrino',
        },
      ],
    });
    const suscripcion = _.get(manada, 'suscripcionPadrino');

    if (!suscripcion || _.isEmpty(_.get(suscripcion, 'productId'))) {
      throw new Error('ERROR - No existe una un producto asociado a la manada');
    }
    const data = {
      id: _.get(manada, 'id'),
      nombre: _.get(manada, 'nombre'),
      monto: _.get(suscripcion, 'montoTotal'),
      productId: _.get(suscripcion, 'productId'),
      planId: _.get(suscripcion, 'planId'),
      subscriptionId: _.get(suscripcion, 'subscriptionId'),
      nombres: _.get(manada, 'Usuario.nombres'),
      apellidos: _.get(manada, 'Usuario.apellidos'),
      email: _.get(manada, 'Usuario.email'),
    };
    const link = await createPlanManada(data);
    const response = {
      message: 'Donacion realizada exitosamente',
      result: link,
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
 * Funcion para aprobar las evidencias de una donacion por parte del donador
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.aprobarDonacion = async (req, res) => {
  try {
    const { donacionId } = req.params;
    const { aprobado } = req.body;
    const update = {
      aprobado,
      updatedAt: Date.now(),
    };
    const donacionInfo = await db.Donacion.update(update, {
      where: { id: donacionId },
    });

    const response = {
      result: donacionInfo,
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
 * Funcion que actualiza el campo pagado en la tabla donacion, para verificar las donaciones que han
 * sido pagadas por parte del administrador de la plataforma
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.pagarDonacion = async (req, res) => {
  try {
    const { donacionId } = req.params;
    const { status } = req.body;
    const update = {
      pagado: _.isEqual(_.toLower(status), 'success'),
      updatedAt: Date.now(),
    };
    const donacionInfo = await db.Donacion.update(update, {
      where: { id: donacionId },
    });

    const response = {
      result: donacionInfo,
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

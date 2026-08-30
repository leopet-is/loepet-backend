const _ = require('lodash');
const dayjs = require('dayjs');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

const db = require('../DB/index');

/**
 * @openapi
 * /denuncias/agrupadas:
 *   get:
 *     tags: [Denuncias]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtiene las fundaciones con denuncias agrupadas por estado (rol administrador de plataforma)
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema: { type: string, default: pendiente, enum: [pendiente, aprobada, rechazada] }
 *         description: Estado de las denuncias a agrupar. Por defecto `pendiente`.
 *     responses:
 *       '200':
 *         description: Fundaciones con su total de denuncias y detalle (incluye datos del donador)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       nombre: { type: string }
 *                       totalDenuncias: { type: integer }
 *                       denuncias:
 *                         type: array
 *                         items: { $ref: '#/components/schemas/Denuncia' }
 *       '403':
 *         description: Acceso denegado (permisos insuficientes)
 *       '500':
 *         description: Error interno del servidor
 */

/**
 * Funcion para obtener reporte de las donaciones filtradas por fecha de creacion
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.getReporSuperAdmin = async (req, res) => {
  try {
    let { fecha } = req.query;
    fecha = _.replace(fecha, '/', '-');
    const date = dayjs(fecha, 'MM-YYYY').get('month');
    const startOfMonth = dayjs()
      .month(date)
      .startOf('month');
    const endOfMonth = dayjs()
      .month(date)
      .endOf('month');
    const query = {
      where: {
        aprobado: true,
        createdAt: {
          [Op.gt]: new Date(startOfMonth),
          [Op.lt]: new Date(endOfMonth),
        },
      },
      include: [
        {
          model: db.Animal,
          required: true,
        },
      ],
      attributes: [
        'animal_id',
        [sequelize.fn('sum', sequelize.col('monto')), 'total'],
      ],
      group: ['animal_id'],
      raw: true,
    };
    const responseBody = await db.Donacion.findAndCountAll(query);
    const { rows } = responseBody;
    const fundaciones = [];
    const total = [];
    rows.forEach((row) => {
      const fundacion = _.get(row, 'Animal.fundacion_id');
      const monto = _.toNumber(_.get(row, 'total'));
      const index = _.indexOf(fundaciones, fundacion);
      if (_.isEqual(index, -1)) {
        fundaciones.push(fundacion);
        total.push(monto);
      } else {
        total[index] += monto;
      }
    });

    const donaciones = await Promise.all(fundaciones.map(async (id, index) => {
      const fundacion = await db.Fundacion.findOne({
        where: { id },
      });
      return {
        ruc: _.get(fundacion, 'id'),
        nombre: _.get(fundacion, 'nombre'),
        monto: _.nth(total, index),
      };
    }));

    const response = {
      result: donaciones,
    };

    return res.send(response);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('ERROR', error);
    const responseError = {
      message: 'Something bad happened!',
      error: error.stack,
    };
    return res.status(500).send(JSON.stringify(responseError));
  }
};

/**
 * Funcion para obtener fundaciones con denuncias pendientes
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.obtenerDenunciasPorFundacion = async (req, res) => {
  try {
    const { estado } = req.query;
    const estadoFiltro = estado || 'pendiente';

    const fundacionesReportadas = await db.Fundacion.findAll({
      attributes: ['id', 'nombre'], // Eliminado 'email' porque no está en el modelo Fundacion
      include: [
        {
          model: db.Denuncia,
          as: 'denunciasRecibidas',
          where: { estado: estadoFiltro },
          required: true,
          include: [
            {
              model: db.Usuario,
              as: 'donador',
              attributes: ['id', 'nombres', 'apellidos', 'email'],
            },
          ],
        },
      ],
    });

    const respuesta = fundacionesReportadas.map((f) => ({
      id: f.id,
      nombre: f.nombre,
      totalDenuncias: f.denunciasRecibidas.length,
      denuncias: f.denunciasRecibidas,
    }));

    return res.status(200).json({
      ok: true,
      data: respuesta,
    });
  } catch (error) {
    console.error('Error al obtener denuncias:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error interno al procesar las denuncias',
      error: error.stack,
    });
  }
};

/* eslint-disable no-await-in-loop, no-console */

const _ = require('lodash');
const { Op } = require('sequelize');

const {
  getAnimalView,
  getCuentaBancaria,
  parseDataPadrinosAnimal,
  parseDataAnimalComision,
} = require('./helpers');

const db = require('../DB/index');

/**
 * @openapi
 * tags:
 *   - name: Fundaciones
 *
 * /fundacion:
 *   get:
 *     tags: [Fundaciones]
 *     summary: Obtiene las fundaciones con paginacion
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Busqueda por nombre de la fundacion
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       '200':
 *         description: Lista paginada de fundaciones
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Paginacion'
 *       '500':
 *         description: Error interno del servidor
 *
 * /fundacion/animales:
 *   get:
 *     tags: [Fundaciones]
 *     summary: Obtiene los animales de las fundaciones aprobadas con paginacion
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
 *         description: Lista paginada de animales
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Paginacion'
 *       '500':
 *         description: Error interno del servidor
 *
 * /fundacion/padrinos/{fundacionId}:
 *   get:
 *     tags: [Fundaciones]
 *     summary: Obtiene el historial de padrinos de los animales de una fundacion
 *     parameters:
 *       - in: path
 *         name: fundacionId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200':
 *         description: Lista de padrinos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: array
 *                   items: { type: object }
 *       '500':
 *         description: Error interno del servidor
 *
 * /fundacion/padrinos/calificacion/{fundacionId}:
 *   get:
 *     tags: [Fundaciones]
 *     summary: Obtiene la calificacion de padrinos de una fundacion
 *     parameters:
 *       - in: path
 *         name: fundacionId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200':
 *         description: Calificaciones de los padrinos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: array
 *                   items: { type: object }
 *       '500':
 *         description: Error interno del servidor
 *
 * /fundacion/{fundacionId}:
 *   get:
 *     tags: [Fundaciones]
 *     summary: Obtiene la informacion de una fundacion por ID
 *     parameters:
 *       - in: path
 *         name: fundacionId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200':
 *         description: Informacion de la fundacion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *       '404':
 *         description: Fundacion no encontrada
 *       '500':
 *         description: Error interno del servidor
 *   put:
 *     tags: [Fundaciones]
 *     security:
 *       - bearerAuth: []
 *     summary: Actualiza la informacion de una fundacion (rol administrador de plataforma)
 *     parameters:
 *       - in: path
 *         name: fundacionId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FundacionRequest'
 *     responses:
 *       '200':
 *         description: Informacion de la fundacion actualizada
 *       '400':
 *         description: Error de validacion de los datos de entrada (formato de RUC/cedula/telefono o digito verificador incorrecto)
 *       '401':
 *         description: No autorizado para realizar la operacion
 *       '409':
 *         description: El RUC ya pertenece a otra fundacion o a una solicitud registrada
 *       '500':
 *         description: Error interno del servidor
 *   delete:
 *     tags: [Fundaciones]
 *     security:
 *       - bearerAuth: []
 *     summary: Elimina una fundacion (borrado logico, rol administrador de plataforma)
 *     parameters:
 *       - in: path
 *         name: fundacionId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200':
 *         description: Fundacion eliminada exitosamente
 *       '401':
 *         description: No autorizado para realizar la operacion
 *       '500':
 *         description: Error interno del servidor
 */

/**
 * Funcion para actualizar la informacion de una fundacion por parte del administrador
 * de la plataforma
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.updateInfoFundacion = async (req, res) => {
  try {
    const { fundacionId } = req.params;
    const {
      ruc, nombre, direccion, telefono, aprobado, comision,
    } = req.body;
    const update = {
      ...(!_.isEmpty(nombre) ? { nombre } : {}),
      ...(!_.isEmpty(direccion) ? { direccion } : {}),
      ...(!_.isEmpty(telefono) ? { telefono } : {}),
      ...(_.isBoolean(aprobado) ? { aprobado } : {}),
      ...(!_.isEmpty(comision) ? { comision } : {}),
      updatedAt: Date.now(),
    };

    if (!_.isEmpty(ruc)) {
      const rucNormalizado = _.trim(String(ruc));

      // Verificar que el RUC no pertenezca a otra fundacion
      const existingFundacion = await db.Fundacion.findOne({
        where: { id: { [Op.ne]: fundacionId }, ruc: rucNormalizado },
      });
      if (existingFundacion) {
        return res.status(409).send({
          error: 'Ya se encuentra registrada una fundacion con ese RUC',
        });
      }

      // Verificar que el RUC no pertenezca a una solicitud pendiente
      const existingSolicitud = await db.SolicitudFundacion.findOne({
        where: { ruc: rucNormalizado },
      });
      if (existingSolicitud) {
        return res.status(409).send({
          error: 'Ya existe una solicitud de fundacion registrada con ese RUC',
        });
      }

      update.ruc = rucNormalizado;
    }

    const fundacion = await db.Fundacion.update(update, {
      where: { id: fundacionId },
    });

    const response = {
      mensaje: 'Informacion actualizada exitosamente.',
      result: fundacion,
    };
    return res.send(response);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).send({
        error: 'Ya se encuentra registrada una fundacion con ese RUC',
      });
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
 * Funcion para obtener la informacion de todas las fundaciones registradas en la BD
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.getFundaciones = async (req, res) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit || '1', 10);
    const page = parseInt(req.query.page || '1', 10);
    const esAdministrador = getAnimalView(req.User) === 'admin';
    const query = {
      where: {
        ...(!esAdministrador ? { aprobado: true } : {}),
        ...(!_.isEmpty(q) ? { nombre: { [Op.regexp]: q } } : {}),
      },
      offset: (page - 1) * limit,
      limit,
      raw: true,
    };

    const fundaciones = await db.Fundacion.findAndCountAll(query);
    const { count, rows } = fundaciones;
    const result = await Promise.all(rows.map(async (fundacion) => {
      const cantidadMascotasCuidado = await db.Animal.count({
        where: { fundacion_id: fundacion.id, visible: true },
      });

      if (!esAdministrador) {
        return {
          id: fundacion.id,
          nombre: fundacion.nombre,
          direccion: fundacion.direccion,
          telefono: fundacion.telefono,
          logo: fundacion.logo,
          descripcion: fundacion.descripcion,
          aprobado: fundacion.aprobado,
          cantidadMascotasCuidado,
        };
      }

      const adminFun = await db.AdminFund.findOne({
        where: { fundacion_id: fundacion.id },
      });
      const cuentaBancaria = await getCuentaBancaria(fundacion.id);
      let user = {};
      if (!_.isEmpty(adminFun)) {
        const admin = await db.Usuario.findOne({ where: { id: adminFun.id } });
        user = !_.isEmpty(admin) ? admin : {};
      }
      return {
        ...fundacion,
        cantidadMascotasCuidado,
        cuentaBancaria,
        user,
      };
    }));
    const totalPages = Math.ceil(count / limit);
    const response = {
      limit,
      page,
      totalPages,
      count,
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
 * Funcion para obtener todos los animales asociados a una fundacion
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.getAnimalFundaciones = async (req, res) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit || '1', 10);
    const page = parseInt(req.query.page || '1', 10);
    const fundacionesAprobadas = await db.Fundacion.findAll({
      where: { aprobado: true },
      attributes: ['id'],
      raw: true,
    });

    const query = {
      where: {
        fundacion_id: { [Op.in]: fundacionesAprobadas.map((fundacion) => fundacion.id) },
        ...(!_.isEmpty(q) ? { nombre: { [Op.regexp]: q } } : {}),
        visible: true,
      },
      offset: (page - 1) * limit,
      limit,
    };
    const animales = await db.Animal.findAndCountAll(query);
    const { count } = animales;
    const totalPages = Math.ceil(count / limit);
    const response = {
      limit,
      page,
      totalPages,
      count,
      result: animales.rows,
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

exports.getAnimalPadrinosFundacion = async (req, res) => {
  try {
    const { fundacionId } = req.params;
    const { User } = req;
    if (getAnimalView(User) !== 'fundacion' || String(User.fundacionId) !== String(fundacionId)) {
      return res.status(403).send({ error: 'No está autorizado para consultar estos padrinos.' });
    }
    const limit = parseInt(req.query.limit || '1', 10);
    const page = parseInt(req.query.page || '1', 10);
    const result = [];
    const query = {
      where: {
        fundacion_id: fundacionId,
        visible: true,
      },
    };
    const animales = await db.Animal.findAndCountAll(query);
    const { count } = animales;

    await Promise.all(animales.rows.map(async (animal) => {
      const animalId = _.get(animal, 'id');
      const manadasAnimal = await db.ManadaAnimal.findAndCountAll({
        where: {
          animal_id: animalId,
        },
      });
      await Promise.all(manadasAnimal.rows.map(async (manadaAnimal) => {
        const manadaId = _.get(manadaAnimal, 'manada_id');
        const manada = await db.Manada.findOne({
          where: {
            id: manadaId,
          },
          include: [
            {
              model: db.SuscripcionPadrino,
              as: 'suscripcionPadrino',
            },
          ],
        });
        const suscripcion = _.get(manada, 'suscripcionPadrino');
        if (!suscripcion || !suscripcion.statusSubscription) return;
        const donadorId = _.get(manada, 'userId');
        const donador = await db.Usuario.findOne({
          where: {
            id: donadorId,
          },
        });
        const animalesEnManada = await db.ManadaAnimal.count({
          where: { manada_id: manadaId },
        });
        const montoMensual = animalesEnManada > 0
          ? Number(suscripcion.montoTotal) / animalesEnManada
          : 0;
        const data = parseDataPadrinosAnimal(animal, manada, donador, montoMensual);
        result.push(data);
      }));
    }));

    const totalPages = Math.ceil(count / limit);
    const response = {
      limit,
      page,
      totalPages,
      count,
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

exports.getAnimalPadrinosCalificacion = async (req, res) => {
  try {
    const { fundacionId } = req.params;
    const limit = parseInt(req.query.limit || '1', 10);
    const page = parseInt(req.query.page || '1', 10);
    const result = [];
    const query = {
      where: {
        fundacion_id: fundacionId,
        visible: true,
      },
    };
    const animales = await db.Animal.findAndCountAll(query);
    const { count } = animales;

    await Promise.all(animales.rows.map(async (animal) => {
      const animalId = _.get(animal, 'id');
      const manadasAnimal = await db.ManadaAnimal.findAndCountAll({
        where: {
          animal_id: animalId,
        },
      });

      await Promise.all(manadasAnimal.rows.map(async (manadaAnimal) => {
        const manadaId = _.get(manadaAnimal, 'manada_id');

        // Verificar si esta combinación manada-animal ya fue reportada en los últimos 30 días
        const hace30Dias = new Date();
        hace30Dias.setDate(hace30Dias.getDate() - 30);

        const yaReportado = await db.ComisionManada.findOne({
          where: {
            manada_id: manadaId,
            animal_id: animalId,
            createdAt: {
              [Op.gte]: hace30Dias,
            },
          },
          include: [{
            model: db.Comision,
            as: 'comisionPadre',
            where: {
              fundacion_id: fundacionId,
            },
          }],
        });

        // Si ya fue reportado recientemente, saltar este registro
        if (!yaReportado) {
          const manada = await db.Manada.findOne({
            where: {
              id: manadaId,
            },
            include: [
              {
                model: db.SuscripcionPadrino,
                as: 'suscripcionPadrino',
              },
            ],
          });
          const donadorId = _.get(manada, 'userId');
          const donador = await db.Usuario.findOne({
            where: {
              id: donadorId,
            },
          });

          const notificacion = await db.Notificacion.findOne({
            limit: 1,
            where: {
              usuario_id: donadorId,
              fundacion_id: fundacionId,
              animal_id: animalId,
            },
            order: [['id', 'DESC']],
          });
          const data = parseDataAnimalComision(animal, manada, donador, notificacion);
          result.push(data);
        }
      }));
    }));

    const totalPages = Math.ceil(count / limit);
    const response = {
      limit,
      page,
      totalPages,
      count,
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
 * Funcion para eliminar una fundacion, se realiza un borrado logico, cambiando el estado
 * del campo aprobado
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.deleteFundacion = async (req, res) => {
  try {
    const { fundacionId } = req.params;
    const update = {
      aprobado: false,
      updatedAt: Date.now(),
    };
    const fundacion = await db.Fundacion.update(update, {
      where: { id: fundacionId, aprobado: true },
    });

    const response = {
      mensaje: 'Fundacion eliminada.',
      result: fundacion,
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
 * Funcion para obtener la informacion de una fundacion por su ID
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.getFundacionById = async (req, res) => {
  try {
    const { fundacionId } = req.params;
    const esAdministrador = getAnimalView(req.User) === 'admin';

    const fundacion = await db.Fundacion.findOne({
      where: { id: fundacionId },
      raw: true,
    });

    if (!fundacion) {
      return res.status(404).send({ error: 'Fundacion no encontrada.' });
    }

    if (!esAdministrador && !fundacion.aprobado) {
      return res.status(404).send({ error: 'Fundacion no encontrada.' });
    }

    const cantidadMascotasCuidado = await db.Animal.count({
      where: {
        fundacion_id: fundacionId,
        visible: true,
      },
    });

    let result = {
      id: fundacion.id,
      nombre: fundacion.nombre,
      ruc: fundacion.ruc,
      direccion: fundacion.direccion,
      telefono: fundacion.telefono,
      logo: fundacion.logo,
      descripcion: fundacion.descripcion,
      aprobado: fundacion.aprobado,
      cantidadMascotasCuidado,
      createdAt: fundacion.createdAt,
      updatedAt: fundacion.updatedAt,
    };

    if (esAdministrador) {
      const adminFun = await db.AdminFund.findOne({
        where: { fundacion_id: fundacion.id },
      });
      const cuentaBancaria = await getCuentaBancaria(fundacion.id);
      let user = {};
      if (!_.isEmpty(adminFun)) {
        const admin = await db.Usuario.findOne({ where: { id: adminFun.id } });
        user = !_.isEmpty(admin) ? admin : {};
      }
      result = {
        ...fundacion,
        cantidadMascotasCuidado,
        cuentaBancaria,
        user,
      };
    }

    return res.send({ result });
  } catch (error) {
    console.log('ERROR', error);
    const responseError = {
      message: 'Something bad happened!',
      error: error.stack,
    };
    return res.status(500).send(JSON.stringify(responseError));
  }
};

/* eslint-disable no-await-in-loop, no-console */

const _ = require('lodash');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

const {
  getCuentaBancaria,
  validateAdminFund,
  validateFundacion,
  validateSuperAdmin,
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
 *   post:
 *     tags: [Fundaciones]
 *     security:
 *       - bearerAuth: []
 *     summary: Crea una fundacion (rol administrador de plataforma)
 *     description: Tambien se puede utilizar para aprobar/crear la fundacion ligada a una solicitud enviando `id` (solicitud) y `user_id`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FundacionRequest'
 *     responses:
 *       '200':
 *         description: Fundacion creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string }
 *                 result: { $ref: '#/components/schemas/Fundacion' }
 *       '400':
 *         description: Error de validacion de los datos de entrada (formato de RUC/cedula/telefono o digito verificador incorrecto)
 *       '401':
 *         description: No autorizado para realizar la operacion
 *       '409':
 *         description: Ya existe una fundacion o solicitud registrada con ese RUC
 *       '500':
 *         description: Error interno del servidor
 *   get:
 *     tags: [Fundaciones]
 *     security:
 *       - bearerAuth: []
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
 *     security:
 *       - bearerAuth: []
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
 * Funcion para crear una fundacion por parte del administrador de la plataforma en la BD
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.createFundacion = async (req, res) => {
  try {
    const { User } = req;
    const {
      ruc, nombre, direccion, telefono, comision, user_id: userId, id: solicitudId,
    } = req.body;

    if (!(await validateSuperAdmin(User.id))) {
      return res
        .status(401)
        .send({ error: 'No esta autorizado para realizar esta operacion!' });
    }

    const rucNormalizado = _.trim(String(ruc));

    if (await validateFundacion(rucNormalizado)) {
      return res.status(409).send({
        error: 'Ya se encuentra registrada una fundacion con ese RUC',
      });
    }

    // Si no se esta creando desde una solicitud aprobada, el RUC no debe
    // coincidir con una solicitud existente (aun no aprobada).
    if (!solicitudId) {
      const existingSolicitud = await db.SolicitudFundacion.findOne({
        where: { ruc: rucNormalizado },
      });
      if (existingSolicitud) {
        return res.status(409).send({
          error: 'Ya existe una solicitud de fundacion registrada con ese RUC',
        });
      }
    }

    const fundacion = await db.Fundacion.create({
      ruc: rucNormalizado,
      nombre,
      direccion,
      telefono,
      aprobado: true,
      comision: comision || 0,
      logo: '/logo.png',
      solicitud_id: solicitudId || null,
    });

    if (solicitudId) {
      const solicitud = await db.SolicitudFundacion.findByPk(solicitudId);
      if (solicitud) {
        const {
          email_contacto: emailContacto,
          nombre_contacto: nombreContacto,
          apellido_contacto: apellidoContacto,
          telefono: telContacto,
          direccion: dirContacto,
          cedula_contacto: cedulaContacto,
        } = solicitud;
        const tempPassword = Math.random().toString(36).slice(-8);
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(tempPassword, salt);

        const newUser = await db.Usuario.create({
          cedula: cedulaContacto,
          nombres: nombreContacto,
          apellidos: apellidoContacto,
          email: emailContacto,
          telefono: telContacto,
          direccion: dirContacto,
          password: hash,
          role: 2, // ADMIN_FUND
        });

        await db.AdminFund.create({
          id: newUser.id,
          fundacion_id: fundacion.id,
        });

        await db.SolicitudFundacion.update(
          {
            ready_for_creation: false,
            notas_admin: `Solicitud aprobada. Usuario creado con contraseña temporal: ${tempPassword}`,
          },
          { where: { id: solicitudId } },
        );
      }
    } else if (userId) {
      const existingAdminFund = await db.AdminFund.findByPk(userId);
      if (existingAdminFund) {
        await existingAdminFund.update({
          fundacion_id: fundacion.id,
        });
      } else {
        await db.AdminFund.create({
          id: userId,
          fundacion_id: fundacion.id,
        });
      }
    }

    const response = {
      mensaje: 'Fundacion registrada exitosamente.',
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
 * CONSIDERAR BORRAR ESTA FUNCION, YA QUE NO SE USA
 * Funcion para enviar una fundacion por desde el Landing Page de la plataforma en la BD
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.registerFundacion = async (req, res) => {
  try {
    const {
      ruc, nombre, direccion, telefono, comision,
    } = req.body;
    if (await validateFundacion(ruc)) {
      return res.status(400).send({
        error: 'La Fundación ya ha registrado una solicitud',
      });
    }
    const fundacion = await db.Fundacion.create({
      ruc,
      nombre,
      direccion,
      telefono,
      aprobado: false,
      comision,
    });
    const response = {
      mensaje: 'La solicitud de registro ha sido enviada.',
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
    const query = {
      where: {
        ...(!_.isEmpty(q) ? { nombre: { [Op.regexp]: q } } : {}),
      },
      offset: (page - 1) * limit,
      limit,
      raw: true,
    };

    const fundaciones = await db.Fundacion.findAndCountAll(query);
    const { count, rows } = fundaciones;
    const result = await Promise.all(rows.map(async (fundacion) => {
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
  console.log('--- CONTROLLER GET_ANIMAL_FUNDACIONES ALCANZADO ---');
  try {
    const { User } = req;
    const { q } = req.query;
    const limit = parseInt(req.query.limit || '1', 10);
    const page = parseInt(req.query.page || '1', 10);

    if (!(await validateAdminFund(User.id))) {
      return res
        .status(401)
        .send({ error: 'No esta autorizado para realizar esta operacion!' });
    }

    const query = {
      where: {
        fundacion_id: User.fundacionId,
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
        });
        const donadorId = _.get(manada, 'userId');
        const donador = await db.Usuario.findOne({
          where: {
            id: donadorId,
          },
        });
        const data = parseDataPadrinosAnimal(animal, manada, donador);
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

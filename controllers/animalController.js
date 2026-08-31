/* eslint-disable no-await-in-loop, no-console, prefer-const, camelcase, eqeqeq */
const _ = require('lodash');
const { Op } = require('sequelize');

const { STATUS_ANIMAL } = require('../constants');
const {
  getFundacionInfo,
  getHistorialAnimal,
  parseData,
  validateAdminFund,
  validateUpdateAnimal,
} = require('./helpers');
const {
  crearNotificacionesNuevoAnimal,
  crearNotificacionesAlerta,
} = require('../services/notificacionService');

const db = require('../DB/index');

/**
 * @openapi
 * tags:
 *   - name: Animales
 *
 * /animal:
 *   get:
 *     tags: [Animales]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtiene todos los animales con paginacion
 *     description: Si se envia el parametro `manada` se listan los animales de esa manada (debe pertenecer al usuario). Soporta filtros por especie y busqueda por nombre.
 *     parameters:
 *       - in: query
 *         name: especie
 *         schema: { type: string }
 *         description: Filtro por especie (PERRO, GATO, etc.)
 *       - in: query
 *         name: manada
 *         schema: { type: integer }
 *         description: Id de una manada para listar solo sus animales
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
 *   post:
 *     tags: [Animales]
 *     security:
 *       - bearerAuth: []
 *     summary: Crea un animal (rol administrador de fundacion)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnimalRequest'
 *     responses:
 *       '200':
 *         description: Animal creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string }
 *                 result: { $ref: '#/components/schemas/Animal' }
 *       '401':
 *         description: No autorizado para realizar la operacion
 *       '500':
 *         description: Error interno del servidor
 *
 * /animal/app:
 *   get:
 *     tags: [Animales]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtiene los animales visibles para la aplicacion movil con paginacion
 *     parameters:
 *       - in: query
 *         name: tipoAnimal
 *         schema: { type: string }
 *         description: Filtro por especie. Enviar `TODOS` (o no enviar) para listar todos.
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
 * /animal/app/fundacion/{fundacionId}:
 *   get:
 *     tags: [Animales]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtiene los animales visibles de una fundacion con paginacion
 *     parameters:
 *       - in: path
 *         name: fundacionId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       '200':
 *         description: Lista paginada de animales de la fundacion
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Paginacion'
 *       '500':
 *         description: Error interno del servidor
 *
 * /animal/especies:
 *   get:
 *     tags: [Animales]
 *     summary: Lista las especies distintas de los animales visibles
 *     responses:
 *       '200':
 *         description: Arreglo de especies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: array
 *                   items: { type: string }
 *       '500':
 *         description: Error interno del servidor
 *
 * /animal/search:
 *   get:
 *     tags: [Animales]
 *     security:
 *       - bearerAuth: []
 *     summary: Busca animales por nombre
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *         description: Texto a buscar en el nombre del animal
 *     responses:
 *       '200':
 *         description: Arreglo de animales encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Animal' }
 *       '500':
 *         description: Error interno del servidor
 *
 * /animal/{animalId}:
 *   get:
 *     tags: [Animales]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtiene la informacion de un animal por id
 *     parameters:
 *       - in: path
 *         name: animalId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200':
 *         description: Informacion del animal (arreglo vacio si no existe)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   oneOf:
 *                     - { $ref: '#/components/schemas/Animal' }
 *                     - { type: array, items: { type: string } }
 *       '500':
 *         description: Error interno del servidor
 *   put:
 *     tags: [Animales]
 *     security:
 *       - bearerAuth: []
 *     summary: Actualiza la informacion de un animal (rol administrador de fundacion)
 *     parameters:
 *       - in: path
 *         name: animalId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnimalRequest'
 *     responses:
 *       '200':
 *         description: Informacion del animal actualizada
 *       '401':
 *         description: No autorizado para realizar la operacion
 *       '500':
 *         description: Error interno del servidor
 *   delete:
 *     tags: [Animales]
 *     security:
 *       - bearerAuth: []
 *     summary: Elimina un animal (borrado logico, rol administrador de fundacion)
 *     parameters:
 *       - in: path
 *         name: animalId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200':
 *         description: Animal eliminado exitosamente
 *       '401':
 *         description: No autorizado para realizar la operacion
 *       '500':
 *         description: Error interno del servidor
 */

/**
 * Funcion para crear un animal en la BD
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.createAnimal = async (req, res) => {
  try {
    const { User } = req;
    const {
      nombre, especie, raza, descripcion, galeria,
      sexo,
      peso,
      enfermedades,
      esterilizacion,
      vacunacion,
      desparasitacion,
    } = req.body;

    if (!(await validateAdminFund(User.id))) {
      return res
        .status(401)
        .send({ error: 'No esta autorizado para realizar esta operacion!' });
    }
    const animal = await db.Animal.create({
      nombre,
      status: STATUS_ANIMAL.DISPONIBLE,
      especie,
      raza,
      descripcion,
      imagen: '',
      galeria,
      fundacion_id: User.fundacionId,
      visible: true,
      sexo,
      peso,
      enfermedades,
      esterilizacion,
      vacunacion,
      desparasitacion,
    });

    // Crear notificaciones para donadores que tienen esta fundación en favoritos
    crearNotificacionesNuevoAnimal(animal);
    crearNotificacionesAlerta(animal);

    const response = {
      mensaje: 'Animal creado exitosamente.',
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
 * Funcion para actualizar la informacion de un animal en la BD
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.updateAnimal = async (req, res) => {
  try {
    const { User } = req;
    const { animalId } = req.params;
    const {
      nombre, especie, raza, descripcion, galeria,
      sexo,
      edad,
      peso,
      enfermedades,
      esterilizacion,
      vacunacion,
      desparasitacion,
    } = req.body;
    const response = {
      result: [],
    };
    if (
      (await validateAdminFund(User.id))
      && (await validateUpdateAnimal(User.fundacionId, animalId))
    ) {
      const update = {
        ...(!_.isEmpty(nombre) ? { nombre } : {}),
        ...(!_.isEmpty(especie) ? { especie } : {}),
        ...(!_.isEmpty(raza) ? { raza } : {}),
        ...(!_.isEmpty(descripcion) ? { descripcion } : {}),
        ...(!_.isEmpty(galeria) ? { galeria } : {}),
        sexo,
        edad,
        peso,
        enfermedades,
        esterilizacion,
        vacunacion,
        desparasitacion,
        updatedAt: Date.now(),
      };
      const animal = await db.Animal.update(update, {
        where: { id: animalId, fundacion_id: User.fundacionId },
      });

      // Obtener el animal actualizado para notificaciones
      const animalActualizado = await db.Animal.findByPk(animalId);
      crearNotificacionesAlerta(animalActualizado);

      response.mensaje = 'Informacion del animal actualizada.';
      response.result = animal;
    }
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
 * Funcion para obtener la informacion de todos los animales, filtrado con o sin referencia de
 * la manada, la respuesta la retorna de forma paginada
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.getAllAnimals = async (req, res) => {
  try {
    const { User } = req;
    const { especie } = req.query;
    const manadaId = req.query.manada ? parseInt(req.query.manada, 10) : null;
    const { q } = req.query;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '1', 10);
    let total;
    let query = {};
    let responseBody;
    let result = [];
    if (!manadaId) {
      query = {
        where: {
          ...(!_.isEmpty(especie) ? { especie } : {}),
          ...(!_.isEmpty(q) ? { nombre: { [Op.regexp]: q } } : {}),
          visible: true,
        },
        order: [['id', 'DESC']],
        offset: (page - 1) * limit,
        limit,
      };
      responseBody = await db.Animal.findAndCountAll(query);
      const { rows, count } = responseBody;
      total = count;
      result = await Promise.all(rows.map(async (animals) => {
        const fundacionId = _.get(animals, 'fundacion_id');
        const fundacion = await getFundacionInfo(fundacionId);
        return parseData(animals, fundacion);
      }));
    } else {
      query = {
        where: {
          id: manadaId,
        },
      };
      const responseManada = await db.Manada.findOne(query);
      if (
        !_.isEmpty(responseManada)
        && _.isEqual(responseManada.userId, User.id)
      ) {
        query = {
          where: {
            manada_id: manadaId,
          },
        };
        responseBody = await db.ManadaAnimal.findAndCountAll(query);
        const { rows, count } = responseBody;
        total = count;
        result = await Promise.all(rows.map(async (animal) => {
          const animals = await db.Animal.findOne({
            where: {
              id: animal.animal_id,
            },
          });
          const fundacionId = _.get(animals, 'fundacion_id');

          const fundacion = await getFundacionInfo(fundacionId);
          let historial = await getHistorialAnimal(User.id, animals.id);
          if (_.isNull(historial)) {
            historial = {};
          }
          return parseData(animals, fundacion, historial);
        }));
      } else {
        total = 0;
      }
    }
    const totalPages = Math.ceil(total / limit);
    const response = {
      limit,
      page,
      totalPages,
      total,
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

exports.getAllAnimalsApp = async (req, res) => {
  try {
    const { tipoAnimal } = req.query;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '1', 10);
    let total;
    let query = {};
    let responseBody;
    query = {
      where: {
        visible: true,
      },
      order: [['id', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    };
    if (!_.isEmpty(tipoAnimal) && tipoAnimal !== 'TODOS') {
      query.where.especie = tipoAnimal;
    }

    responseBody = await db.Animal.findAndCountAll(query);
    const { rows, count } = responseBody;
    total = count;
    const result = await Promise.all(rows.map(async (animals) => {
      const fundacionId = _.get(animals, 'fundacion_id');
      const fundacion = await getFundacionInfo(fundacionId);
      return parseData(animals, fundacion);
    }));

    const totalPages = Math.ceil(total / limit);
    const response = {
      limit,
      page,
      totalPages,
      total,
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

exports.getAllAnimalsFundacionApp = async (req, res) => {
  try {
    const { fundacionId } = req.params;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '1', 10);
    let total;
    let query = {};
    let responseBody;
    query = {
      where: {
        fundacion_id: fundacionId,
        visible: true,
      },
      order: [['id', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    };

    responseBody = await db.Animal.findAndCountAll(query);
    const { rows, count } = responseBody;
    total = count;
    const result = await Promise.all(rows.map(async (animals) => {
      const animalFundacionId = _.get(animals, 'fundacion_id');
      const fundacion = await getFundacionInfo(animalFundacionId);
      return parseData(animals, fundacion);
    }));

    const totalPages = Math.ceil(total / limit);
    const response = {
      limit,
      page,
      totalPages,
      total,
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
 * Funcion para obtener todas las especies de los animales registrados en la BD
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.getEspecies = async (req, res) => {
  try {
    const responseBody = await db.Animal.findAll({
      where: { visible: true },
      attributes: ['especie'],
      group: ['especie'],
    });
    const result = responseBody.map((especie) => _.get(especie, 'especie'));
    const response = {
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
 * Funcion para obtener la informacion de un solo animal
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.getAnimal = async (req, res) => {
  try {
    const { animalId } = req.params;
    let result = [];
    const response = {
      result,
    };

    const responseBody = await db.Animal.findOne({
      where: { id: animalId, visible: true },
    });

    if (_.isEmpty(responseBody)) {
      return res.send(response);
    }
    result = responseBody;
    response.result = result;
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
 * Funcion para buscar un animal filtrado por el nombre del mismo
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.searchAnimal = async (req, res) => {
  try {
    const { q } = req.query;
    let result = [];
    const response = {
      result,
    };
    const responseBody = await db.Animal.findAll({
      where: { nombre: { [Op.regexp]: `${q}` }, visible: true },
    });

    if (_.isEmpty(responseBody)) {
      return res.send(response);
    }
    result = responseBody;
    response.result = result;
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
 * Funcion para eliminar un animal, se realiza un borrado logico, cambiando el estado
 * del campo visible
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.deleteAnimal = async (req, res) => {
  try {
    const { User } = req;
    const { animalId } = req.params;

    if (!(await validateAdminFund(User.id))) {
      return res
        .status(401)
        .send({ error: 'No esta autorizado para realizar esta operacion!' });
    }

    let mensaje = 'Animal eliminado exitosamente';
    const animal = await db.Animal.findOne({
      where: { id: animalId, visible: true },
    });
    if (_.isEmpty(animal)) {
      mensaje = 'Animal no encontrado';
    }

    const update = {
      visible: false,
      updatedAt: Date.now(),
    };
    await db.Animal.update(update, {
      where: { id: animalId, fundacion_id: User.fundacionId },
    });
    const response = {
      mensaje,
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

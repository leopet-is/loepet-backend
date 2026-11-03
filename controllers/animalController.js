/* eslint-disable no-await-in-loop, no-console, prefer-const, camelcase, eqeqeq */
const _ = require('lodash');
const { Op, literal } = require('sequelize');

const { STATUS_ANIMAL } = require('../constants');
const {
  getAnimalView,
  getFundacionInfo,
  getHistorialAnimal,
  serializeAnimal,
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
 *     summary: Obtiene todos los animales con paginacion
 *     description: Si se envia el parametro `manada` se listan los animales de esa manada (debe pertenecer al usuario). Soporta filtros por especie y busqueda por nombre. Ordena primero animales en tratamiento y con mayor necesidad mensual de apadrinamiento.
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
 *         schema: { type: integer, default: 1, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, minimum: 1, maximum: 100 }
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
 *     summary: Alias compatible de GET /animal con paginacion y vista por rol
 *     parameters:
 *       - in: query
 *         name: tipoAnimal
 *         schema: { type: string }
 *         description: Filtro por especie. Enviar `TODOS` (o no enviar) para listar todos.
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, minimum: 1, maximum: 100 }
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
 *     summary: Alias compatible de GET /animal filtrado por fundacion y vista por rol
 *     parameters:
 *       - in: path
 *         name: fundacionId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, minimum: 1, maximum: 100 }
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
 *     summary: Elimina un animal (rol administrador de fundacion)
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
      monto_meta_mensual,
      monto_recaudado_actual,
      fecha_nacimiento_estimada,
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
      status: STATUS_ANIMAL.REQUIERE_PADRINOS,
      especie,
      raza,
      descripcion,
      imagen: '',
      galeria,
      fundacion_id: User.fundacionId,
      visible: true,
      sexo,
      peso,
      monto_meta_mensual,
      monto_recaudado_actual,
      fecha_nacimiento_estimada,
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
      fecha_nacimiento_estimada,
      peso,
      monto_meta_mensual,
      monto_recaudado_actual,
      enfermedades,
      esterilizacion,
      vacunacion,
      desparasitacion,
    } = req.body;
    if (!(await validateAdminFund(User.id))) {
      return res.status(401).send({ error: 'No esta autorizado para realizar esta operacion!' });
    }
    if (!(await validateUpdateAnimal(User.fundacionId, animalId))) {
      return res.status(404).send({ error: 'Animal no encontrado en la fundacion' });
    }

    const update = {
      ...(!_.isEmpty(nombre) ? { nombre } : {}),
      ...(!_.isEmpty(especie) ? { especie } : {}),
      ...(!_.isEmpty(raza) ? { raza } : {}),
      ...(!_.isEmpty(descripcion) ? { descripcion } : {}),
      ...(!_.isEmpty(galeria) ? { galeria } : {}),
      ...(_.isUndefined(sexo) ? {} : { sexo }),
      ...(_.isUndefined(fecha_nacimiento_estimada) ? {} : { fecha_nacimiento_estimada }),
      ...(_.isUndefined(peso) ? {} : { peso }),
      ...(_.isUndefined(monto_meta_mensual) ? {} : { monto_meta_mensual }),
      ...(_.isUndefined(monto_recaudado_actual) ? {} : { monto_recaudado_actual }),
      ...(_.isUndefined(enfermedades) ? {} : { enfermedades }),
      ...(_.isUndefined(esterilizacion) ? {} : { esterilizacion }),
      ...(_.isUndefined(vacunacion) ? {} : { vacunacion }),
      ...(_.isUndefined(desparasitacion) ? {} : { desparasitacion }),
      updatedAt: Date.now(),
    };
    await db.Animal.update(update, {
      where: { id: animalId, fundacion_id: User.fundacionId },
    });

    const animalActualizado = await db.Animal.findByPk(animalId);
    crearNotificacionesAlerta(animalActualizado);

    return res.send({
      mensaje: 'Informacion del animal actualizada.',
      result: animalActualizado,
    });
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
    const especie = req.query.especie || req.query.tipoAnimal;
    const manadaId = req.query.manada ? parseInt(req.query.manada, 10) : null;
    const fundacionId = req.params.fundacionId || req.query.fundacionId;
    const { q } = req.query;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const view = getAnimalView(User);
    const prioridadEstado = literal(`CASE status
      WHEN '${STATUS_ANIMAL.EN_TRATAMIENTO}' THEN 0
      WHEN '${STATUS_ANIMAL.REQUIERE_PADRINOS}' THEN 1
      WHEN '${STATUS_ANIMAL.APADRINADO}' THEN 2
      WHEN '${STATUS_ANIMAL.INACTIVO}' THEN 3
      WHEN '${STATUS_ANIMAL.FALLECIDO}' THEN 4
      ELSE 5
    END`);
    const necesidadMensual = literal(
      'GREATEST(COALESCE(monto_meta_mensual, 0) - COALESCE(monto_recaudado_actual, 0), 0)',
    );
    const ordenAnimales = [
      [prioridadEstado, 'ASC'],
      [necesidadMensual, 'DESC'],
      ['updatedAt', 'ASC'],
      ['id', 'DESC'],
    ];
    let total = 0;
    let result = [];

    if (manadaId) {
      if (!User) return res.status(401).send({ error: 'Token no proporcionado' });
      const responseManada = await db.Manada.findOne({
        where: {
          id: manadaId,
        },
      });
      if (!responseManada || !_.isEqual(responseManada.userId, User.id)) {
        return res.send({
          limit, page, totalPages: 0, total: 0, result,
        });
      }
      const relations = await db.ManadaAnimal.findAndCountAll({
        where: {
          manada_id: manadaId,
        },
        include: [{
          model: db.Animal,
          as: 'animal',
          where: { visible: true },
          required: true,
        }],
        order: [
          [literal(`CASE "animal"."status"
            WHEN '${STATUS_ANIMAL.EN_TRATAMIENTO}' THEN 0
            WHEN '${STATUS_ANIMAL.REQUIERE_PADRINOS}' THEN 1
            WHEN '${STATUS_ANIMAL.APADRINADO}' THEN 2
            WHEN '${STATUS_ANIMAL.INACTIVO}' THEN 3
            WHEN '${STATUS_ANIMAL.FALLECIDO}' THEN 4
            ELSE 5
          END`), 'ASC'],
          [literal('GREATEST(COALESCE("animal"."monto_meta_mensual", 0) - COALESCE("animal"."monto_recaudado_actual", 0), 0)'), 'DESC'],
          [{ model: db.Animal, as: 'animal' }, 'updatedAt', 'ASC'],
          [{ model: db.Animal, as: 'animal' }, 'id', 'DESC'],
        ],
        offset: (page - 1) * limit,
        limit,
      });
      total = relations.count;
      const animals = relations.rows.map((relation) => relation.animal);
      const fundacionIds = _.uniq(animals.map((animal) => animal.fundacion_id));
      const fundaciones = await db.Fundacion.findAll({
        where: { id: { [Op.in]: fundacionIds } },
      });
      const fundacionesPorId = new Map(fundaciones.map((fundacion) => [fundacion.id, fundacion]));
      result = await Promise.all(relations.rows.map(async (relation) => {
        const { animal } = relation;
        const historial = await getHistorialAnimal(User.id, animal.id);
        return serializeAnimal(animal, fundacionesPorId.get(animal.fundacion_id), historial || {}, view);
      }));
    } else {
      const approvedFoundations = await db.Fundacion.findAll({
        where: {
          aprobado: true,
          ...(fundacionId ? { id: fundacionId } : {}),
        },
        attributes: ['id'],
        raw: true,
      });
      const normalizedSpecies = _.toUpper(especie);
      const query = {
        where: {
          fundacion_id: { [Op.in]: approvedFoundations.map((foundation) => foundation.id) },
          ...(!_.isEmpty(normalizedSpecies) && normalizedSpecies !== 'TODOS'
            ? { especie: _.includes(['PERRO', 'GATO', 'OTRO'], normalizedSpecies) ? normalizedSpecies : 'OTRO' }
            : {}),
          ...(!_.isEmpty(q) ? { nombre: { [Op.regexp]: q } } : {}),
          visible: true,
        },
        order: ordenAnimales,
        offset: (page - 1) * limit,
        limit,
      };
      const responseBody = await db.Animal.findAndCountAll(query);
      total = responseBody.count;
      result = await Promise.all(responseBody.rows.map(async (animal) => {
        const fundacion = await getFundacionInfo(animal.fundacion_id);
        return serializeAnimal(animal, fundacion, {}, view);
      }));
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

exports.getAllAnimalsApp = exports.getAllAnimals;
exports.getAllAnimalsFundacionApp = exports.getAllAnimals;

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
    const view = getAnimalView(req.User);
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
    const fundacion = await getFundacionInfo(responseBody.fundacion_id);
    result = serializeAnimal(responseBody, fundacion, {}, view);
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
    const view = getAnimalView(req.User);
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
    result = await Promise.all(responseBody.map(async (animal) => {
      const fundacion = await getFundacionInfo(animal.fundacion_id);
      return serializeAnimal(animal, fundacion, {}, view);
    }));
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

    const animal = await db.Animal.findOne({
      where: { id: animalId, fundacion_id: User.fundacionId },
    });
    if (_.isEmpty(animal)) {
      return res.status(404).send({ error: 'Animal no encontrado' });
    }

    await db.Animal.destroy({ where: { id: animalId, fundacion_id: User.fundacionId } });
    const response = {
      mensaje: 'Animal eliminado exitosamente',
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

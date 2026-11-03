/* eslint-disable no-await-in-loop, no-console */
const _ = require('lodash');
const { Op } = require('sequelize');

const { createProductManada } = require('./helpersPayPal');

const {
  validateManada,
  validateAnimalManada,
} = require('./helpers');

const db = require('../DB/index');

const NUMERO_MAXIMO_FOTOS = 4;

/**
 * @openapi
 * tags:
 *   - name: Manadas
 *
 * /manada:
 *   post:
 *     tags: [Manadas]
 *     security:
 *       - bearerAuth: []
 *     summary: Crea una manada (rol donador)
 *     description: Al crear la manada se solicita el producto/plan en PayPal (en pruebas sin credenciales PayPal se usa un mock).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ManadaRequest'
 *     responses:
 *       '200':
 *         description: Manada creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string }
 *                 manada: { $ref: '#/components/schemas/Manada' }
 *       '401':
 *         description: No autorizado para realizar la operacion
 *       '500':
 *         description: Error interno del servidor
 *   get:
 *     tags: [Manadas]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtiene las manadas del donador con paginacion
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Busqueda por nombre de la manada
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       '200':
 *         description: Manadas del donador (incluye numero de apadrinados y fotos)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 limit: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 *                 count: { type: integer }
 *                 result:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Manada' }
 *       '500':
 *         description: Error interno del servidor
 *
 * /manada/search:
 *   get:
 *     tags: [Manadas]
 *     security:
 *       - bearerAuth: []
 *     summary: Busca manadas por nombre
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: Arreglo de manadas encontradas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Manada' }
 *       '500':
 *         description: Error interno del servidor
 *
 * /manada/{manadaId}:
 *   put:
 *     tags: [Manadas]
 *     security:
 *       - bearerAuth: []
 *     summary: Actualiza la informacion de una manada (rol donador propietario)
 *     parameters:
 *       - in: path
 *         name: manadaId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ManadaRequest'
 *     responses:
 *       '200':
 *         description: Informacion de la manada actualizada
 *       '500':
 *         description: Error interno del servidor
 *   delete:
 *     tags: [Manadas]
 *     security:
 *       - bearerAuth: []
 *     summary: Elimina una manada (borrado logico, rol donador propietario)
 *     parameters:
 *       - in: path
 *         name: manadaId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200':
 *         description: Manada eliminada exitosamente
 *       '401':
 *         description: No autorizado para realizar la operacion
 *       '500':
 *         description: Error interno del servidor
 *
 * /manada/{manadaId}/animals:
 *   post:
 *     tags: [Manadas]
 *     security:
 *       - bearerAuth: []
 *     summary: Agrega animales a una manada (rol donador propietario)
 *     parameters:
 *       - in: path
 *         name: manadaId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [animalId]
 *             properties:
 *               animalId:
 *                 type: array
 *                 items: { type: integer }
 *                 description: Ids de los animales a agregar
 *     responses:
 *       '200':
 *         description: Animales agregados exitosamente a la manada
 *       '401':
 *         description: No autorizado para realizar la operacion
 *       '500':
 *         description: Error interno del servidor
 *   get:
 *     tags: [Manadas]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtiene los animales asociados a una manada
 *     parameters:
 *       - in: path
 *         name: manadaId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200':
 *         description: Arreglo de animales de la manada
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
 * /manada/{manadaId}/animals/{animalId}:
 *   delete:
 *     tags: [Manadas]
 *     security:
 *       - bearerAuth: []
 *     summary: Elimina un animal de una manada (rol donador propietario)
 *     parameters:
 *       - in: path
 *         name: manadaId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: animalId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       '200':
 *         description: Animal eliminado de la manada
 *       '401':
 *         description: No autorizado para realizar la operacion
 *       '500':
 *         description: Error interno del servidor
 */

/**
 * Funcion para crear una manada en la BD
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.createManada = async (req, res) => {
  const { User } = req;

  try {
    const { nombre, monto } = req.body;

    const manada = await db.Manada.create({
      nombre,
      userId: User.id,
      status: 1,
    });
    const data = {
      id: _.get(manada, 'id'),
      manadaId: _.get(manada, 'id'),
      nombre,
      montoTotal: monto || 0,
    };
    await createProductManada(data);

    const response = {
      mensaje: 'Manada creada exitosamente',
      manada,
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
 * Funcion para agregar animales a una manada previamente registrada en la BD
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.addAnimals = async (req, res) => {
  const { User } = req;

  try {
    const { manadaId } = req.params;
    const manada = req.body;
    const animals = _.get(manada, 'animalId');

    if (!_.isArray(animals) || _.isEmpty(animals)) {
      return res
        .status(400)
        .send({ error: 'El campo animalId debe ser un arreglo de ids no vacio' });
    }

    if (!(await validateManada(manadaId, User.id))) {
      return res
        .status(401)
        .send({ error: 'No esta autorizado para realizar esta operacion!' });
    }

    const animalesUnicos = _.uniq(animals).map((animal) => Number(animal));
    const responses = await Promise.all(animalesUnicos.map(async (animal) => {
      const query = {
        manada_id: manadaId,
        animal_id: animal,
      };
      if (await validateAnimalManada(manadaId, animal)) {
        return db.ManadaAnimal.create(query);
      }
      return { animal_id: animal, mensaje: 'Este animal ya se encuentra agregado a la manada' };
    }));

    const response = {
      mensaje: 'Animales agregados exitosamente a la manada',
      data: responses,
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
 * Funcion para obtener la informacion de las manadas asociadas a un Donador
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.getManadas = async (req, res) => {
  // FIX NUMERO DE FOTOS
  try {
    const { User } = req;
    const { q } = req.query;
    const limit = parseInt(req.query.limit || '1', 10);
    const page = parseInt(req.query.page || '1', 10);
    const query = {
      where: {
        userId: User.id,
        status: true,
        ...(!_.isEmpty(q) ? { nombre: { [Op.regexp]: q } } : {}),
      },
      order: [['id', 'DESC']],
      offset: (page - 1) * limit,
      limit,
      include: [
        {
          model: db.SuscripcionPadrino,
          as: 'suscripcionPadrino',
        },
      ],
    };
    const responseBody = await db.Manada.findAndCountAll(query);
    const { count } = responseBody;
    const totalPages = Math.ceil(count / limit);
    const manadas = responseBody.rows;

    const manadaIds = manadas.map((manada) => manada.id);
    const relaciones = await db.ManadaAnimal.findAll({
      where: { manada_id: { [Op.in]: manadaIds } },
      order: [['id', 'ASC']],
    });
    const animalIds = _.uniq(relaciones.map((relacion) => relacion.animal_id));
    const animales = await db.Animal.findAll({
      where: { id: { [Op.in]: animalIds }, visible: true },
    });
    const animalesPorId = new Map(animales.map((animal) => [animal.id, animal]));
    const relacionesPorManada = _.groupBy(relaciones, 'manada_id');

    const responses = manadas.map((manada) => {
      const manadaId = manada.id;
      const relacionesManada = relacionesPorManada[manadaId] || [];
      const fotos = relacionesManada.reduce((fotosManada, relacion) => {
        if (fotosManada.length >= NUMERO_MAXIMO_FOTOS) return fotosManada;
        const animal = animalesPorId.get(relacion.animal_id);
        const firstPhoto = _.first(_.get(animal, 'galeria.fotos'));
        if (!_.isEmpty(firstPhoto)) fotosManada.push(firstPhoto);
        return fotosManada;
      }, []);

      return {
        id: manadaId,
        nombre: _.get(manada, 'nombre'),
        monto: _.get(manada, 'suscripcionPadrino.montoTotal', 0),
        statusSubscription: _.get(manada, 'suscripcionPadrino.statusSubscription', false),
        apadrinados: relacionesManada.length,
        galeria: fotos,
      };
    });

    const response = {
      limit,
      page,
      totalPages,
      count,
      result: responses,
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
 * Funcion para obtener todos los animales asociados a una manada en la BD
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.getAnimalManadas = async (req, res) => {
  try {
    const { User } = req;
    const { manadaId } = req.params;

    if (!(await validateManada(manadaId, User.id))) {
      return res
        .status(401)
        .send({ error: 'No esta autorizado para realizar esta operacion!' });
    }

    const responseBody = await db.ManadaAnimal.findAll({
      where: {
        manada_id: manadaId,
      },
      include: [{
        model: db.Animal,
        as: 'animal',
        where: { visible: true },
        required: true,
      }],
    });
    const animals = responseBody.map((relation) => relation.animal);
    const animalIds = animals.map((animal) => animal.id);
    const fundacionIds = _.uniq(animals.map((animal) => animal.fundacion_id));
    const [fundaciones, actualizaciones] = await Promise.all([
      db.Fundacion.findAll({
        where: { id: { [Op.in]: fundacionIds }, aprobado: true },
      }),
      db.ActualizacionAnimal.findAll({
        where: { animal_id: { [Op.in]: animalIds }, visible: true },
        order: [['id', 'DESC']],
      }),
    ]);
    const fundacionesPorId = new Map(fundaciones.map((fundacion) => [fundacion.id, fundacion]));
    const historialPorAnimal = _.groupBy(actualizaciones, 'animal_id');

    const result = animals.map((animal) => {
      const fundacion = fundacionesPorId.get(animal.fundacion_id);
      const historial = (historialPorAnimal[animal.id] || []).slice(0, 10);
      return {
        id: _.get(animal, 'id'),
        nombre: _.get(animal, 'nombre'),
        status: _.get(animal, 'status'),
        especie: _.get(animal, 'especie'),
        raza: _.get(animal, 'raza'),
        descripcion: _.get(animal, 'descripcion'),
        galeria: _.get(animal, 'galeria'),
        fundacion_id: _.get(animal, 'fundacion_id'),
        fundacion: _.get(fundacion, 'nombre'),
        historial,
        createdAt: _.get(animal, 'createdAt'),
        updatedAt: _.get(animal, 'updatedAt'),
      };
    });

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
 * Funcion para filtrar Manadas a traves de un parametro de busqueda
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.searchManada = async (req, res) => {
  try {
    const { User } = req;
    const { q } = req.query;
    let result = [];
    const response = {
      result,
    };
    if (_.isEmpty(q)) {
      return res.send(response);
    }
    const responseBody = await db.Manada.findAll({
      where: {
        nombre: { [Op.regexp]: `${q}` },
        userId: User.id,
        status: true,
      },
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
 * Funcion para eliminar un animal asociado a una manada
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.deleteAnimalManada = async (req, res) => {
  try {
    const { User } = req;
    const { manadaId, animalId } = req.params;
    const validationManada = await validateManada(manadaId, User.id);

    if (!validationManada) {
      return res
        .status(401)
        .send({ error: 'No esta autorizado para realizar esta operacion!' });
    }
    const existente = await db.ManadaAnimal.findOne({
      where: { manada_id: manadaId, animal_id: animalId },
    });
    if (_.isEmpty(existente)) {
      return res.status(404).send({ error: 'El animal no se encuentra en la manada' });
    }
    await db.ManadaAnimal.destroy({
      where: { manada_id: manadaId, animal_id: animalId },
    });
    const response = { result: 'Animal eliminado de la manada' };
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
 * Funcion para eliminar una manada, se realiza un borrado logico cambiando el estado del campo
 * status a false
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.deleteManada = async (req, res) => {
  try {
    const { User } = req;
    const { manadaId } = req.params;
    const validationManada = await validateManada(manadaId, User.id);

    if (!validationManada) {
      return res
        .status(401)
        .send({ error: 'No esta autorizado para realizar esta operacion!' });
    }
    const update = {
      status: false,
      updatedAt: Date.now(),
    };
    await db.Manada.update(update, {
      where: { id: manadaId },
    });
    const response = { result: 'Manada eliminada exitosamente' };
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
 * Funcion para actualizar la informacion de una manada en la BD
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.updateInfoManada = async (req, res) => {
  try {
    const { User } = req;
    const { manadaId } = req.params;
    const {
      nombre, monto,
    } = req.body;
    const validationManada = await validateManada(manadaId, User.id);
    if (!validationManada) {
      return res
        .status(401)
        .send({ error: 'No esta autorizado para realizar esta operacion!' });
    }
    const update = {
      ...(!_.isEmpty(nombre) ? { nombre } : {}),
      updatedAt: Date.now(),
    };
    await db.Manada.update(update, {
      where: { id: manadaId },
    });
    if (!_.isEmpty(monto)) {
      const suscripcion = await db.SuscripcionPadrino.findOne({ where: { manadaId } });
      if (suscripcion) {
        await suscripcion.update({ montoTotal: monto, updatedAt: Date.now() });
      }
    }
    const response = { result: 'Informacion actualizada' };
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

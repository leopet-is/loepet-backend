const _ = require('lodash');

const {
  validateAdminFund,
  validateDonador,
} = require('./helpers');
const db = require('../DB/index');
const {
  crearNotificacionesActualizacion,
} = require('../services/notificacionService');

exports.createActualizacion = async (req, res) => {
  try {
    const {
      descripcion,
      estado_salud: estadoSalud,
      animal_id: animalId,
      fundacion_id: fundacionId,
      fecha,
      galeria,
      imagen,
    } = req.body;
    console.log(`createActualizacion: animal_id=${animalId}, fundacion_id=${fundacionId}`);
    const actualizacion = await db.ActualizacionAnimal.create({
      descripcion,
      estado_salud: estadoSalud,
      animal_id: animalId,
      fundacion_id: fundacionId,
      fecha,
      galeria,
      imagen,
      visible: true,
    });
    console.log(`createActualizacion: Actualización creada con ID ${actualizacion.id}`);

    // Crear notificaciones para donadores que tienen esta actualización (a través de manadas)
    console.log('createActualizacion: Llamando crearNotificacionesActualizacion');
    crearNotificacionesActualizacion(actualizacion);

    const response = {
      mensaje: 'Actualizacion registrada exitosamente.',
      result: actualizacion,
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

exports.updateActualizacion = async (req, res) => {
  try {
    const { User } = req;
    const { actualizacionId } = req.params;
    const {
      descripcion,
      estado_salud: estadoSalud,
      galeria,
      imagen,
    } = req.body;

    const response = {
      result: [],
    };
    if (
      (await validateAdminFund(User.id))

    ) {
      const update = {
        ...(!_.isEmpty(descripcion) ? { descripcion } : {}),
        ...(!_.isEmpty(estadoSalud) ? { estado_salud: estadoSalud } : {}),
        ...(!_.isEmpty(galeria) ? { galeria } : {}),
        ...(!_.isEmpty(imagen) ? { imagen } : {}),
        updatedAt: Date.now(),
      };
      const actualizacion = await db.ActualizacionAnimal.update(update, {
        where: { id: actualizacionId, fundacion_id: User.fundacionId },
      });
      response.mensaje = 'Informacion del animal actualizada.';
      response.result = actualizacion;
    }
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

exports.deleteActualizacion = async (req, res) => {
  try {
    const { User } = req;
    const { actualizacionId } = req.params;

    if (!(await validateAdminFund(User.id))) {
      return res
        .status(401)
        .send({ error: 'No esta autorizado para realizar esta operacion!' });
    }

    let mensaje = 'Actualizacion eliminado exitosamente';
    const actualizacion = await db.ActualizacionAnimal.findOne({
      where: { id: actualizacionId, visible: true },
    });
    if (_.isEmpty(actualizacion)) {
      mensaje = 'Actualizacion no encontrada';
    }

    const update = {
      visible: false,
      updatedAt: Date.now(),
    };
    await db.ActualizacionAnimal.update(update, {
      where: { id: actualizacionId, fundacion_id: User.fundacionId },
    });
    const response = {
      mensaje,
      result: actualizacion,
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

exports.getActualizaciones = async (req, res) => {
  try {
    const fundacionId = req.query.fundacion_id || req.query.fundacionId;
    const limit = parseInt(req.query.limit || '1', 10);
    const page = parseInt(req.query.page || '1', 10);
    const where = {
      visible: true,
    };
    if (fundacionId) {
      where.fundacion_id = fundacionId;
    }
    const query = {
      where,
      offset: (page - 1) * limit,
      limit,
    };
    const actualizaciones = await db.ActualizacionAnimal.findAndCountAll(query);
    const { count } = actualizaciones;

    const result = await Promise.all(actualizaciones.rows.map(async (actualizacion) => {
      const animalId = _.get(actualizacion, 'animal_id');
      const fundacionIdFila = _.get(actualizacion, 'fundacion_id');
      const animal = await db.Animal.findOne({
        where: {
          id: animalId,
        },
      });
      const fundacion = await db.Fundacion.findOne({
        where: {
          id: fundacionIdFila,
        },
      });

      return {
        ...actualizacion.toJSON(),
        animal: animal ? animal.toJSON() : null,
        fundacion: fundacion ? fundacion.toJSON() : null,
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
    // eslint-disable-next-line no-console
    console.log('ERROR', error);
    const responseError = {
      message: 'Something bad happened!',
      error: error.stack,
    };
    return res.status(500).send(JSON.stringify(responseError));
  }
};

exports.createRating = async (req, res) => {
  try {
    const { User } = req;
    const { actualizacionId } = req.params;
    const { estrellas, comentario } = req.body;

    const actualizacion = await db.ActualizacionAnimal.findOne({
      where: {
        id: actualizacionId,
        visible: true,
      },
    });
    if (_.isEmpty(actualizacion)) {
      return res.status(404).send({ message: 'Actualizacion no encontrada' });
    }

    const esDonador = await validateDonador(User.id);
    if (!esDonador) {
      return res.status(403).send({ message: 'Solo los donadores pueden calificar actualizaciones' });
    }

    const esPadrino = await db.ManadaAnimal.findOne({
      where: {
        animal_id: actualizacion.animal_id,
      },
      include: [
        {
          model: db.Manada,
          as: 'manada',
          where: {
            userId: User.id,
          },
        },
      ],
    });
    if (_.isEmpty(esPadrino)) {
      return res.status(403).send({ message: 'Debe ser padrino del animal para calificar esta actualizacion' });
    }

    const [rating, creado] = await db.RatingActualizacion.findOrCreate({
      where: {
        actualizacionId,
        userId: _.get(User, 'id'),
      },
      defaults: {
        actualizacionId,
        userId: _.get(User, 'id'),
        estrellas,
        comentario,
      },
    });

    const response = {
      mensaje: creado
        ? 'Rating registrado exitosamente.'
        : 'Ya habias calificado esta actualizacion.',
      result: rating,
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

exports.loadRating = async (req, res) => {
  try {
    const { actualizacionId } = req.params;

    const actualizacion = await db.ActualizacionAnimal.findOne({
      where: {
        id: actualizacionId,
        visible: true,
      },
    });
    if (_.isEmpty(actualizacion)) {
      return res.status(404).send({ message: 'Actualizacion no encontrada' });
    }

    const { count, rows } = await db.RatingActualizacion.findAndCountAll({
      where: {
        actualizacionId,
      },
    });
    let promedio = 0;
    rows.forEach((element) => {
      promedio += parseFloat(element.estrellas);
    });
    const response = {
      actualizacionId,
      total_ratings: count,
      promedio_ratings: count > 0 ? promedio / count : 0,
      ratings: rows,
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

const _ = require('lodash');

const { validateAdminFund } = require('./helpers');
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
    } = req.body;
    console.log(`createActualizacion: animal_id=${animalId}, fundacion_id=${fundacionId}`);
    const actualizacion = await db.ActualizacionAnimal.create({
      descripcion,
      estado_salud: estadoSalud,
      animal_id: animalId,
      fundacion_id: fundacionId,
      fecha,
      galeria,
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
    const { descripcion, estado_salud: estadoSalud, galeria } = req.body;

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
    const { fundacionId } = req.query;
    const limit = parseInt(req.query.limit || '1', 10);
    const page = parseInt(req.query.page || '1', 10);
    const query = {
      where: {
        fundacion_id: fundacionId,
        visible: true,
      },
      offset: (page - 1) * limit,
      limit,
    };
    const actualizaciones = await db.ActualizacionAnimal.findAndCountAll(query);
    const { count } = actualizaciones;

    const result = await Promise.all(actualizaciones.rows.map(async (actualizacion) => {
      const animalId = _.get(actualizacion, 'animal_id');
      const animal = await db.Animal.findOne({
        where: {
          id: animalId,
        },
      });
      const fundacion = await db.Fundacion.findOne({
        where: {
          id: fundacionId,
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
    const { actualizacionId } = req.params;
    const { valor } = req.body;
    await db.Rating.create({
      valor,
      actualizacion_id: actualizacionId,
    });

    const response = {
      mensaje: 'Rating registrado exitosamente.',
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
    const { count, rows } = await db.Rating.findAndCountAll({
      where: {
        actualizacion_id: actualizacionId,
      },
    });
    let promedio = 0;
    rows.forEach((element) => {
      promedio += parseFloat(element.valor);
    });
    console.log(promedio);
    const response = {
      total_ratings: count,
      promedio_ratings: count > 0 ? promedio / count : 0,
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

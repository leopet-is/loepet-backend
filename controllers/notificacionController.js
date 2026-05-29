/* eslint-disable camelcase */
const _ = require('lodash');

const { validateRequest } = require('../helpers');
const {
  getFundacionInfo,
  parseDataNotificacion,
} = require('./helpers');

const db = require('../DB/index');

exports.getNotificaciones = async (req, res) => {
  await validateRequest(req);
  try {
    const { User } = req;
    const query = {
      where: {
        usuario_id: User.id,
        visible: true,
      },
      order: [['createdAt', 'DESC']],
    };
    const notificaciones = await db.Notificacion.findAndCountAll(query);
    console.log(`getNotificaciones: Total de notificaciones en DB: ${notificaciones.count}`);

    const processedRows = await Promise.all(notificaciones.rows.map(async (notificacion) => {
      const actualizacionId = _.get(notificacion, 'actualizacion_id');
      const fundacionId = _.get(notificacion, 'fundacion_id');
      const animalId = _.get(notificacion, 'animal_id');
      console.log(`Procesando notificación ID: ${notificacion.id}, actualizacion_id: ${actualizacionId}, animal_id: ${animalId}`);

      // Lógica diferente según el tipo de notificación
      let mostrarNotificacion = false;

      if (actualizacionId) {
        // Para notificaciones de actualización, siempre mostrar
        // (ya fueron creadas solo para donadores)
        mostrarNotificacion = true;
        console.log('Notificación de actualización - siempre mostrar');
      } else {
        // Para otras notificaciones (nuevo animal, alerta salud),
        // verificar si la fundación está en favoritos
        const esFavorito = await db.FavoritoFundacion.findOne({
          where: {
            usuario_id: User.id,
            fundacion_id: fundacionId,
          },
        });
        mostrarNotificacion = !!esFavorito;
        console.log(`Notificación de otro tipo - ¿Es favorito?: ${mostrarNotificacion}`);
      }

      // Si no debe mostrarse, saltamos esta notificación
      if (!mostrarNotificacion) {
        console.log('Saltando notificación - no cumple condiciones');
        return null;
      }
      console.log('Mostrar notificación');

      const actualizacion = await db.ActualizacionAnimal.findOne({
        where: {
          id: actualizacionId,
        },
      });
      const fundacion = await getFundacionInfo(fundacionId);
      const animal = await db.Animal.findOne({
        where: {
          id: animalId,
        },
      });

      return {
        ...parseDataNotificacion(notificacion, actualizacion, animal, fundacion),
        donacion_id: null,
      };
    }));

    const result = processedRows.filter((row) => row !== null);
    const count = result.length;

    console.log(`getNotificaciones: Devolviendo ${result.length} notificaciones de ${count} totales`);
    const response = {
      count: Math.max(0, count),
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

exports.updateNotificacion = async (req, res) => {
  await validateRequest(req);
  try {
    const { notificacionId } = req.params;
    const {
      leido, fecha_leido, calificacion, fecha_calificacion,
    } = req.body;
    const response = {
      result: [],
    };

    const update = {
      ...(!_.isNull(leido) ? { leido } : {}),
      ...(!_.isNull(fecha_leido) ? { fecha_leido } : {}),
      ...(!_.isNull(calificacion) ? { calificacion } : {}),
      ...(!_.isNull(fecha_calificacion) ? { fecha_calificacion } : {}),
      updatedAt: Date.now(),
    };
    const notificacion = await db.Notificacion.update(update, {
      where: { id: notificacionId },
    });
    response.mensaje = 'Informacion actualizada.';
    response.result = notificacion;

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

exports.crearNotificacionAdmin = async (req, res) => {
  try {
    const { fundacionId, mensaje } = req.body;

    if (!fundacionId || !mensaje) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    const nuevaNotificacion = await db.Notificacion.create({
      fundacion_id: fundacionId,
      mensaje,
      es_admin_mensaje: true,
      leido: false,
      visible: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Actualizar estado de denuncias pendientes a 'notificada'
    await db.Denuncia.update(
      { estado: 'notificada' },
      {
        where: {
          fundacionId,
          estado: 'pendiente',
        },
      },
    );

    return res.status(201).json({ ok: true, data: nuevaNotificacion });
  } catch (error) {
    console.error('Error creando notificación:', error);
    return res.status(500).json({ message: 'Error interno' });
  }
};

exports.getNotificacionesFundacion = async (req, res) => {
  try {
    const { User } = req;
    // Si el usuario es admin de fundación, obtenemos su fundacionId
    // Asumimos que el middleware passport ya populó User.fundacionId si es rol ADMIN_FUND
    const { fundacionId } = User;

    if (!fundacionId) {
      return res.status(400).json({ message: 'Usuario no asociado a una fundación' });
    }

    const notificaciones = await db.Notificacion.findAll({
      where: {
        fundacion_id: fundacionId,
        es_admin_mensaje: true,
        visible: true,
      },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({ ok: true, data: notificaciones });
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    return res.status(500).json({ message: 'Error interno' });
  }
};

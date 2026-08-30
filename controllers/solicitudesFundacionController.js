const _ = require('lodash');
const { Op } = require('sequelize');

const { validateRequest } = require('../helpers');
const db = require('../DB/index');
const { SOLICITUD_FUNDACION_ESTADO } = require('../constants');

/**
 * Funcion para crear una solicitud de fundacion desde el Landing Page
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.createSolicitudFundacion = async (req, res) => {
  await validateRequest(req);
  try {
    const {
      ruc,
      nombre,
      direccion,
      telefono,
      email_contacto: emailContacto,
      nombre_contacto: nombreContacto,
      apellido_contacto: apellidoContacto,
      cedula_contacto: cedulaContacto,
      comentarios,
    } = req.body;

    // Validar si ya existe una solicitud con el mismo RUC o email de contacto
    const existingSolicitud = await db.SolicitudFundacion.findOne({
      where: {
        [Op.or]: [{ ruc }, { email_contacto: emailContacto }],
      },
    });

    if (existingSolicitud) {
      return res.status(400).send({
        error: 'Ya existe una solicitud registrada con este RUC o correo electrónico.',
      });
    }

    const solicitud = await db.SolicitudFundacion.create({
      ruc,
      nombre,
      direccion,
      telefono,
      email_contacto: emailContacto,
      nombre_contacto: nombreContacto,
      apellido_contacto: apellidoContacto,
      cedula_contacto: cedulaContacto,
      comentarios,
      estado: SOLICITUD_FUNDACION_ESTADO.PENDIENTE, // Estado inicial
    });

    const response = {
      mensaje: 'Solicitud de fundación enviada exitosamente.',
      result: solicitud,
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
 * Funcion para obtener todas las solicitudes de fundacion (para el administrador)
 * Permite filtrar por estado y buscar por nombre de fundacion o contacto.
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.getAllSolicitudesFundacion = async (req, res) => {
  await validateRequest(req);
  try {
    const { q, estado } = req.query;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);

    const where = {};

    if (estado) {
      where.estado = estado;
    }

    if (q) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${q}%` } },
        { nombre_contacto: { [Op.like]: `%${q}%` } },
        { apellido_contacto: { [Op.like]: `%${q}%` } },
      ];
    }

    const { count, rows: solicitudes } = await db.SolicitudFundacion.findAndCountAll({
      where,
      offset: (page - 1) * limit,
      limit,
      order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(count / limit);

    const response = {
      limit,
      page,
      totalPages,
      total: count,
      result: solicitudes,
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
 * Funcion para aprobar una solicitud de fundacion
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.aprobarSolicitudFundacion = async (req, res) => {
  await validateRequest(req);
  try {
    const { solicitudId } = req.params;

    const solicitud = await db.SolicitudFundacion.findOne({
      where: { id: solicitudId },
    });

    if (_.isEmpty(solicitud)) {
      return res.status(404).send({ error: 'Solicitud no encontrada.' });
    }

    const update = {
      estado: SOLICITUD_FUNDACION_ESTADO.APROBADA,
      notas_admin: 'Solicitud aprobada. Pendiente creación de usuario.',
      ready_for_creation: true,
      updatedAt: Date.now(),
    };

    await db.SolicitudFundacion.update(update, {
      where: { id: solicitudId },
    });

    const updatedSolicitud = await db.SolicitudFundacion.findOne({
      where: { id: solicitudId },
    });

    const response = {
      mensaje: 'Solicitud aprobada exitosamente.',
      result: updatedSolicitud,
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
 * Funcion para rechazar una solicitud de fundacion
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.rechazarSolicitudFundacion = async (req, res) => {
  await validateRequest(req);
  try {
    const { solicitudId } = req.params;
    const { notas_admin: notasAdmin } = req.body;

    if (!notasAdmin) {
      return res.status(400).send({ error: 'El motivo del rechazo es requerido en las notas.' });
    }

    const solicitud = await db.SolicitudFundacion.findOne({
      where: { id: solicitudId },
    });

    if (_.isEmpty(solicitud)) {
      return res.status(404).send({ error: 'Solicitud no encontrada.' });
    }

    const update = {
      estado: SOLICITUD_FUNDACION_ESTADO.RECHAZADA,
      notas_admin: notasAdmin,
      updatedAt: Date.now(),
    };

    await db.SolicitudFundacion.update(update, {
      where: { id: solicitudId },
    });

    const updatedSolicitud = await db.SolicitudFundacion.findOne({
      where: { id: solicitudId },
    });

    const response = {
      mensaje: 'Solicitud rechazada exitosamente.',
      result: updatedSolicitud,
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
 * Funcion para obtener solicitudes de fundacion listas para la creacion de usuario
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.getSolicitudesReadyForCreation = async (req, res) => {
  await validateRequest(req);
  try {
    const solicitudes = await db.SolicitudFundacion.findAll({
      where: {
        estado: SOLICITUD_FUNDACION_ESTADO.APROBADA,
        ready_for_creation: true,
      },
      order: [['createdAt', 'ASC']],
    });

    const response = {
      result: solicitudes,
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
 * Funcion para obtener los detalles de una sola solicitud de fundacion
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.getSolicitudFundacion = async (req, res) => {
  await validateRequest(req);
  try {
    const { solicitudId } = req.params;

    const solicitud = await db.SolicitudFundacion.findOne({
      where: { id: solicitudId },
    });

    if (_.isEmpty(solicitud)) {
      return res.status(404).send({ error: 'Solicitud no encontrada.' });
    }

    const response = {
      result: solicitud,
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

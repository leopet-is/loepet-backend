/* eslint-disable no-await-in-loop, no-console */

const _ = require('lodash');
const db = require('../DB/index');
const { STATUS_ANIMAL, ROL } = require('../constants');

/**
 * Funcion para parsear la informacion, retorna un nuevo objeto
 * @param  {Object} animal
 * @param  {Object} fundacion
 * @param  {Object} historial
 * @return {Object} response
 */
exports.parseData = (animal, fundacion, historial = {}) => {
  return exports.serializeAnimal(animal, fundacion, historial, 'full');
};

/**
 * Determina la vista segun el rol del usuario
 * @param  {Object} user
 * @return {String} 'admin' | 'fundacion' | 'public'
 */
exports.getAnimalView = (user) => {
  if (user?.role === ROL.ADMIN.ROL_ID) return 'admin';
  if (user?.role === ROL.ADMIN_FUND.ROL_ID) return 'fundacion';
  return 'public';
};

exports.serializeAnimal = (animal, fundacion, historial = {}, view = 'public') => {
  const data = {
    id: _.get(animal, 'id'),
    nombre: _.get(animal, 'nombre'),
    status: _.get(animal, 'status'),
    especie: _.get(animal, 'especie'),
    raza: _.get(animal, 'raza'),
    descripcion: _.get(animal, 'descripcion'),
    imagen: _.get(animal, 'imagen'),
    galeria: _.get(animal, 'galeria'),
    fundacion_id: _.get(animal, 'fundacion_id'),
    fundacion: _.get(fundacion, 'nombre'),
  };

  if (view === 'fundacion' || view === 'admin' || view === 'full') {
    Object.assign(data, {
      fecha_nacimiento_estimada: _.get(animal, 'fecha_nacimiento_estimada'),
      sexo: _.get(animal, 'sexo'),
      peso: _.get(animal, 'peso'),
      enfermedades: _.get(animal, 'enfermedades'),
      esterilizacion: _.get(animal, 'esterilizacion'),
      vacunacion: _.get(animal, 'vacunacion'),
      desparasitacion: _.get(animal, 'desparasitacion'),
      fecha_rescate: _.get(animal, 'fecha_rescate'),
      fecha_registro: _.get(animal, 'fecha_registro'),
    });
  }

  if (view === 'admin' || view === 'full') {
    Object.assign(data, {
      monto_meta_mensual: _.get(animal, 'monto_meta_mensual'),
      monto_recaudado_actual: _.get(animal, 'monto_recaudado_actual'),
      createdAt: _.get(animal, 'createdAt'),
      updatedAt: _.get(animal, 'updatedAt'),
    });
  }

  if (!_.isEmpty(historial)) data.historial = historial;
  return data;
};

exports.parseDataActualizacion = (
  actualizacion,
  animal,
  fundacion = {},
) => {
  const data = {
    id: _.get(actualizacion, 'id'),
    fecha: _.get(actualizacion, 'fecha'),
    descripcion: _.get(actualizacion, 'descripcion'),
    estado_salud: _.get(actualizacion, 'estado_salud'),
    image: _.get(actualizacion, 'imagen'),
    calificacion: _.get(actualizacion, 'calificacion'),
    fundacion_id: _.get(actualizacion, 'fundacion_id'),
    fundacion: _.get(fundacion, 'nombre'),
    galeria: _.get(actualizacion, 'galeria'),
    animal: {
      id: _.get(animal, 'id'),
      nombre: _.get(animal, 'nombre'),
      status: _.get(animal, 'status'),
      especie: _.get(animal, 'especie'),
      raza: _.get(animal, 'raza'),
      descripcion: _.get(animal, 'descripcion'),
      imagen: _.get(animal, 'imagen'),
      galeria: _.get(animal, 'galeria'),
      fundacion_id: _.get(animal, 'fundacion_id'),
      fecha_nacimiento_estimada: _.get(animal, 'fecha_nacimiento_estimada'),
      sexo: _.get(animal, 'sexo'),
      peso: _.get(animal, 'peso'),
      enfermedades: _.get(animal, 'enfermedades'),
      esterilizacion: _.get(animal, 'esterilizacion'),
      vacunacion: _.get(animal, 'vacunacion'),
      desparasitacion: _.get(animal, 'desparasitacion'),
      fecha_rescate: _.get(animal, 'fecha_rescate'),
      fecha_registro: _.get(animal, 'fecha_registro'),
    },
  };
  return data;
};

exports.parseDataNotificacion = (
  notificacion,
  actualizacion,
  animal,
  fundacion = {},
) => {
  /* fundacion,  galeria  = {}) => { */
  const esAlerta = _.get(notificacion, 'es_alerta_salud');
  let tipoNotificacion = 'actualización';

  if (actualizacion === null) {
    // Sin actualización
    if (esAlerta) {
      tipoNotificacion = 'alertaSalud';
    } else {
      tipoNotificacion = 'nuevoAnimal';
    }
  }

  const data = {
    id: _.get(notificacion, 'id'),
    leido: _.get(notificacion, 'leido'),
    calificacion: _.get(notificacion, 'calificacion'),
    tipoNotificacion,
    descripcionAlerta: _.get(notificacion, 'descripcion_alerta'),
    actualizacion: actualizacion ? {
      id: _.get(actualizacion, 'id'),
      fecha: _.get(actualizacion, 'fecha'),
      descripcion: _.get(actualizacion, 'descripcion'),
      estado_salud: _.get(actualizacion, 'estado_salud'),
      image: _.get(actualizacion, 'imagen'),
      fundacion_id: _.get(actualizacion, 'fundacion_id'),
      fundacion: _.get(fundacion, 'nombre'),
      galeria: _.get(actualizacion, 'galeria'),
    } : null,
    animal: {
      id: _.get(animal, 'id'),
      nombre: _.get(animal, 'nombre'),
      status: _.get(animal, 'status'),
      especie: _.get(animal, 'especie'),
      raza: _.get(animal, 'raza'),
      descripcion: _.get(animal, 'descripcion'),
      imagen: _.get(animal, 'imagen'),
      galeria: _.get(animal, 'galeria'),
      fundacion_id: _.get(animal, 'fundacion_id'),
      fecha_nacimiento_estimada: _.get(animal, 'fecha_nacimiento_estimada'),
      peso: _.get(animal, 'peso'),
      sexo: _.get(animal, 'sexo'),
      enfermedades: _.get(animal, 'enfermedades'),
      esterilizacion: _.get(animal, 'esterilizacion'),
      vacunacion: _.get(animal, 'vacunacion'),
      desparasitacion: _.get(animal, 'desparasitacion'),
      fecha_rescate: _.get(animal, 'fecha_rescate'),
      fecha_registro: _.get(animal, 'fecha_registro'),
    },
    fundacion: _.get(fundacion, 'nombre'),
  };
  return data;
};

exports.parseDataPadrinosAnimal = (animal, manada, donador = {}) => {
  const monto = _.get(manada, 'suscripcionPadrino.montoTotal', _.get(manada, 'monto', 0));
  const data = {
    nombre: _.get(animal, 'nombre'),
    especie: _.get(animal, 'especie'),
    raza: _.get(animal, 'raza'),
    padrinoNombre: _.get(donador, 'nombres'),
    padrinoApellido: _.get(donador, 'apellidos'),
    manadaNombre: _.get(manada, 'nombre'),
    monto,
  };
  return data;
};

exports.parseDataAnimalComision = (animal, manada, donador, notificacion = {}) => {
  const comision = 15;
  const monto = _.get(manada, 'suscripcionPadrino.montoTotal', _.get(manada, 'monto', 0));
  const montocomision = (_.toNumber(monto) * comision) / 100;
  const subtotal = _.toNumber(monto) - ((_.toNumber(monto) * comision) / 100);
  let calificacion = _.get(notificacion, 'calificacion');
  calificacion = calificacion == null ? 0 : calificacion;
  let total;
  if (calificacion >= 0 && calificacion < 1) {
    total = subtotal * 0;
  } else if (calificacion >= 1 && calificacion < 2) {
    total = subtotal / 1.25;
  } else if (calificacion >= 2 && calificacion < 3) {
    total = subtotal / 1.50;
  } else if (calificacion >= 3 && calificacion < 4) {
    total = subtotal / 1.75;
  } else if (calificacion >= 4 && calificacion <= 5) {
    total = subtotal;
  }
  const data = {
    nombre: _.get(animal, 'nombre'),
    especie: _.get(animal, 'especie'),
    raza: _.get(animal, 'raza'),
    padrinoNombre: _.get(donador, 'nombres'),
    padrinoApellido: _.get(donador, 'apellidos'),
    manadaNombre: _.get(manada, 'nombre'),
    monto,
    montocomision,
    subtotal,
    calificacion,
    total,
    animalid: _.get(animal, 'id'),
    userid: _.get(donador, 'id'),
    manadaid: _.get(manada, 'id'),
    notificacionid: _.get(notificacion, 'id'),
  };
  return data;
};

/**
 * Funcion para validar que el usuario es SuperAdmin
 * @param  {Int} userId
 * @return {Boolean} response
 */
exports.validateSuperAdmin = async (userId) => {
  try {
    const Usuario = await db.Usuario.findOne({
      where: {
        id: userId,
      },
    });
    if (_.isEqual(Usuario.role, ROL.ADMIN.ROL_ID)) {
      return true;
    }
    return false;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Funcion para validar que el usuario es Administrador de Fundacion
 * @param  {Int} userId
 * @return {Boolean} response
 */
exports.validateAdminFund = async (userId) => {
  try {
    const Usuario = await db.Usuario.findOne({
      where: {
        id: userId,
      },
    });

    if (_.isEqual(Usuario.role, ROL.ADMIN_FUND.ROL_ID)) {
      return true;
    }
    return false;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Funcion para validar que el usuario es Donador
 * @param  {Int} userId
 * @return {Boolean} response
 */
exports.validateDonador = async (userId) => {
  try {
    const Usuario = await db.Usuario.findOne({
      where: {
        id: userId,
      },
    });
    if (_.isEqual(Usuario.role, ROL.DONADOR.ROL_ID)) {
      return true;
    }
    return false;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Funcion para validar que el Administrador de la Fundacion tiene permiso
 * de actualizar la informacion de un animal en especifico
 * @param  {Int} fundacionId
 * @param  {Int} animalId
 * @return {Boolean} response
 */
exports.validateUpdateAnimal = async (fundacionId, animalId) => {
  try {
    const Animal = await db.Animal.findOne({
      where: {
        id: animalId,
        fundacion_id: fundacionId,
      },
    });

    if (_.isEmpty(Animal)) {
      return false;
    }
    return true;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Funcion para validar que un animal ya esta registrado a una manada
 * @param  {Int} manadaId
 * @param  {Int} animalId
 * @return {Boolean} response
 */
exports.validateAnimalManada = async (manadaId, animalId) => {
  try {
    const Animal = await db.ManadaAnimal.findOne({
      where: {
        manada_id: manadaId,
        animal_id: animalId,
      },
    });

    if (_.isEmpty(Animal)) {
      return true;
    }
    return false;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Funcion para obtener la informacion de una fundacion
 * @param  {Int} fundacionId
 * @return {Object} response
 */
exports.getFundacionInfo = async (fundacionId) => {
  const fundacion = await db.Fundacion.findOne({
    where: {
      id: fundacionId,
    },
  });
  return fundacion;
};

/**
 * Funcion para obtener la informacion de una cuenta bancaria asociada a una fundacion
 * @param  {Int} fundacionId
 * @return {Object} response
 */
exports.getCuentaBancaria = async (fundacionId) => {
  const cuentaBancaria = await db.CuentaBancaria.findOne({
    where: {
      fundacion_id: fundacionId,
    },
  });
  if (_.isEmpty(cuentaBancaria)) {
    return {};
  }
  return cuentaBancaria;
};

/**
 * Funcion para obtener el historial de actualizaciones de un animal en especifico
 * @param  {Int} donadorId
 * @param  {Int} animalId
 * @return {Object} response
 */
exports.getHistorialAnimal = async (donadorId, animalId) => {
  try {
    const historial = await db.ActualizacionAnimal.findAll({
      where: {
        animal_id: animalId,
        visible: true,
      },
      order: [['id', 'DESC']],
      limit: 10,
    });
    if (_.isEmpty(historial)) {
      return [];
    }
    return historial;
  } catch (error) {
    console.log('ERROR', error);
    const responseError = {
      message: 'Something bad happened!',
      error: error.stack,
    };
    throw new Error(JSON.stringify(responseError));
  }
};

/**
 * Funcion para validar que una manada pertenece a un Donador
 * @param  {Int} manadaId
 * @param  {Int} userId
 * @return {Boolean} response
 */
exports.validateManada = async (manadaId, userId) => {
  try {
    const data = await db.Manada.findOne({
      where: {
        id: manadaId,
        userId,
      },
    });
    if (_.isEmpty(data)) {
      return false;
    }
    return true;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Funcion para validar que el RUC o documento de identificacion de una Fundacion
 * no este repetido en la BD
 * @param  {String} ruc
 * @return {Boolean} response
 */
exports.validateFundacion = async (ruc) => {
  try {
    const data = await db.Fundacion.findOne({
      where: {
        ruc,
      },
    });
    if (_.isEmpty(data)) {
      return false;
    }
    return true;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Funcion para actualizar la recaudacion mensual de un animal cuando recibe un
 * aporte de apadrinamiento. Si la recaudacion acumulada alcanza la meta
 * mensual, el estado cambia a "APADRINADO".
 * @param  {Int} animalId
 * @param  {Number} montoDonacion
 */
exports.changeStatus = async (animalId, montoDonacion = 0) => {
  try {
    const animal = await db.Animal.findOne({ where: { id: animalId } });
    if (!animal) return;

    const recaudado = _.toNumber(animal.monto_recaudado_actual) + _.toNumber(montoDonacion);
    const meta = _.toNumber(animal.monto_meta_mensual);

    const update = {
      monto_recaudado_actual: recaudado,
      updatedAt: Date.now(),
    };
    // Animales fuera del programa de apadrinamiento no se marcan como cubiertos.
    if (!_.includes(['FALLECIDO', 'INACTIVO'], animal.status)) {
      update.status = recaudado >= meta && meta > 0
        ? STATUS_ANIMAL.APADRINADO
        : STATUS_ANIMAL.REQUIERE_PADRINOS;
    }

    await db.Animal.update(update, {
      where: { id: animalId },
    });
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Funcion para obtener las actualizaciones visibles de un animal
 * @param  {int} animalId
 * @return {Array} response
 */
exports.getActualizacionesAnimal = async (animalId) => {
  try {
    const actualizaciones = await db.ActualizacionAnimal.findAll({
      where: { animal_id: animalId, visible: true },
      order: [['id', 'DESC']],
      limit: 10,
    });
    return actualizaciones;
  } catch (error) {
    throw new Error(error);
  }
};

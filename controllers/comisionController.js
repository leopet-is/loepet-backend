/* eslint-disable no-console */

const db = require('../DB/index');

/**
 * Funcion para obtener la informacion de la cuenta bancaria registrada por una fundacion
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */

/**
 * Funcion para crear una cuenta bancaria de una fundacion en la BD
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.getComisionesPorFundacion = async (req, res) => {
  console.log('Received request for getComisionesPorFundacion.');
  try {
    const { fundacionId } = req.User; // Tomado del usuario autenticado
    console.log('Fundacion ID:', fundacionId);

    if (!fundacionId) {
      return res.status(403).send({ error: 'Acceso denegado. El usuario no es administrador de una fundación.' });
    }

    const comisiones = await db.Comision.findAll({
      where: {
        fundacion_id: fundacionId,
        visible: true,
      },
      order: [['createdAt', 'DESC']],
    });

    console.log('Comisiones found:', comisiones);
    const response = {
      mensaje: 'Comisiones obtenidas exitosamente.',
      result: comisiones,
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

exports.crearComision = async (req, res) => {
  console.log(req.body);
  try {
    const {
      fundacionId, total_comision: totalComision, total_pago: totalPago, animales,
    } = req.body;

    // Validar que se hayan enviado los animales con sus manadas
    if (!animales || !Array.isArray(animales) || animales.length === 0) {
      return res.status(400).send({
        error: 'Debe incluir al menos un animal con su manada en el reporte',
      });
    }

    // Crear la comisión
    const comision = await db.Comision.create({
      fundacion_id: fundacionId,
      total_comision: totalComision,
      total_pago: totalPago,
      createdAt: Date.now(),
      visible: true,
    });

    // Crear los registros de comision_manada para cada animal/manada incluida
    const comisionManadasData = animales.map((animal) => ({
      comision_id: comision.id,
      manada_id: animal.manadaid,
      animal_id: animal.animalid,
      monto: animal.monto || 0,
      comision: animal.montocomision || 0,
      monto_a_pagar: animal.total || 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    await db.ComisionManada.bulkCreate(comisionManadasData);

    const response = {
      mensaje: 'Comision Creada exitosamente.',
      result: comision,
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

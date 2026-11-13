/* eslint-disable no-console */
const _ = require('lodash');
const axios = require('axios');
const request = require('request');

const { changeStatus } = require('./helpers');

const db = require('../DB/index');

const auth = {
  user: process.env.PAYPAL_CLIENT,
  pass: process.env.PAYPAL_SECRET,
};

exports.getAvailability = (req, res) => {
  const available = Boolean(
    process.env.PAYPAL_CLIENT
    && process.env.PAYPAL_SECRET
    && process.env.PAYPAL_URI
    && process.env.PAYPAL_WEBHOOK_ID
    && process.env.FRONTEND_URL,
  );
  return res.send({
    available,
    ...(available ? {} : { message: 'Pagos PayPal no configurados en el servidor.' }),
  });
};

/**
 * TEST
 * Funcion de prueba para crear un producto en PayPal
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.createProduct = (req, res) => {
  const product = {
    name: 'MANADA1',
    description: 'MANADA TEST',
    type: 'SERVICE',
    category: 'SERVICES',
    image_url:
      'https://miamimundo.com/wp-content/uploads/2021/04/27-octubre-dia-del-gato-negro.jpg',
  };
  request.post(
    `${process.env.PAYPAL_URI}/v1/catalogs/products`,
    {
      auth,
      body: product,
      json: true,
    },
    (err, response) => {
      res.json({ data: response.body });
    },
  );
};

/**
 * TEST
 * Funcion de prueba para crear un plan en PayPal
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.createPlan = (req, res) => {
  const plan = {
    name: 'Plan Manada 1',
    product_id: 'PROD-72N86012AT3887120',
    status: 'ACTIVE',
    billing_cycles: [
      {
        frequency: {
          interval_unit: 'MONTH',
          interval_count: 1,
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 12,
        pricing_scheme: {
          fixed_price: {
            value: '40',
            currency_code: 'USD',
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      payment_failure_threshold: 3,
    },
  };
  request.post(
    `${process.env.PAYPAL_URI}/v1/billing/plans`,
    {
      auth,
      body: plan,
      json: true,
    },
    (err, response) => {
      res.json({ data: response.body });
    },
  );
};

/**
 * TEST
 * Funcion de prueba para crear una subscripcion en PayPal
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.generateSubscription = (req, res) => {
  const subscription = {
    plan_id: 'P-62689139PY483641CMEQ42OQ',
    start_time: '2021-08-25T00:00:00Z',
    quantity: 1,
    subscriber: {
      name: {
        given_name: 'Omar',
        surname: 'Rosales',
      },
      email_address: 'edison@gmail.com',
    },
    return_url: 'http://localhost:5173/?status=approved',
    cancel_url: 'http://localhost:5173/?status=cancelled',
  };
  request.post(
    `${process.env.PAYPAL_URI}/v1/billing/subscriptions`,
    {
      auth,
      body: subscription,
      json: true,
    },
    (err, response) => {
      res.json({ data: response.body });
    },
  );
};

/**
 * WEBHOOK
 * Funcion de suscribirse al evento "Billing subscription actived" de PayPal, se verifica que
 * la susbscripcion haya sido aceptada por el donador y agrega el pago de la suscripcion mensual
 * a la tabla Donacion
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.verifySubscription = async (req, res) => {
  const { body } = req;
  console.log('BODY', body);
  const data = _.isEmpty(body) ? {} : body;
  const subscription = _.get(data, 'resource');
  const status = _.get(subscription, 'status');
  const event = _.get(data, 'event_type');
  if (_.isEqual(event, 'BILLING.SUBSCRIPTION.ACTIVATED') && _.isEqual(status, 'ACTIVE')) {
    const subscriptionId = _.get(subscription, 'id');
    // Localizar la suscripcion de pago (antes ese estado vivia en manada).
    const suscripcion = await db.SuscripcionPadrino.findOne({
      where: { subscriptionId },
    });
    if (suscripcion) {
      const [updatedCount] = await db.SuscripcionPadrino.update(
        { statusSubscription: true, updatedAt: Date.now() },
        { where: { id: suscripcion.id, statusSubscription: false } },
      );
      if (!updatedCount) return res.json({ data });
      const { manadaId } = suscripcion;
      const { rows, count } = await db.ManadaAnimal.findAndCountAll({
        include: [
          {
            model: db.Manada,
            where: { id: manadaId },
            required: true,
          },
        ],
        raw: true,
      });

      await Promise.all(rows.map(async (animal) => {
        const donacion = {
          donador_id: _.get(animal, 'Manada.userId'),
          animal_id: _.get(animal, 'animal_id'),
          monto: suscripcion.montoTotal / count,
          aprobado: false,
          pagado: false,
        };
        await db.Donacion.create(donacion);
        await changeStatus(_.get(animal, 'animal_id'), _.get(donacion, 'monto'));
      }));
    }
  }
  return res.json({ data });
};

/**
 * WEBHOOK
 * Funcion de suscribirse al evento "Billing subscription payment failed" de PayPal,
 * se verifica si el pago correspondiente a la susbscripcion fallo,
 * en caso de fallar el statusSubscription se cambiara a false
 * para evitar irregularidades en los valores recibidos por donaciones
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.verifyPaymentFailed = async (req, res) => {
  const { body } = req;
  console.log('BODY', body);
  const data = _.isEmpty(body) ? {} : body;
  const subscription = _.get(data, 'resource');
  const event = _.get(data, 'event_type');
  console.log('EVENT', event);
  if (_.isEqual(event, 'BILLING.SUBSCRIPTION.PAYMENT.FAILED')) {
    const subscriptionId = _.get(subscription, 'id');
    console.log('subscriptionId', subscriptionId);
    const update = {
      statusSubscription: false,
      updatedAt: Date.now(),
    };
    console.log('update', update);
    // El flag vive ahora en SuscripcionPadrino, no en manada.
    await db.SuscripcionPadrino.update(update, {
      where: { subscriptionId },
    });
  }
  res.json({ data });
};

/**
 * WEBHOOK
 * Funcion de suscribirse al evento "Billing subscription cancelled" de PayPal, se verifica que
 * la susbscripcion haya sido cancelada por el donador y se cambia el valor del campo
 * statusSubscription a false
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.verifyCancelSubscription = async (req, res) => {
  const { body } = req;
  console.log('BODY', body);
  const data = _.isEmpty(body) ? {} : body;
  const subscription = _.get(data, 'resource');
  const status = _.get(subscription, 'status');
  const event = _.get(data, 'event_type');
  if (_.isEqual(event, 'BILLING.SUBSCRIPTION.CANCELLED') && _.isEqual(status, 'CANCELLED')) {
    const subscriptionId = _.get(subscription, 'id');
    const update = {
      statusSubscription: false,
      updatedAt: Date.now(),
    };
    await db.SuscripcionPadrino.update(update, {
      where: { subscriptionId },
    });
  }
  res.json({ data });
};

/**
 * WEBHOOK
 * Funcion para cancelar la susbscripcion a una manada
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const { User } = req;
    const { manadaId } = req.body;
    const manada = await db.Manada.findOne({
      where: { id: manadaId },
    });
    if (!manada || String(manada.userId) !== String(User.id)) {
      return res.status(404).send({ error: 'Manada no encontrada.' });
    }
    // El subscriptionId vive ahora en la suscripcion de la manada.
    const suscripcion = await db.SuscripcionPadrino.findOne({
      where: { manadaId },
    });
    const subscriptionId = _.get(suscripcion, 'subscriptionId') || _.get(manada, 'subscriptionId');
    if (_.isEmpty(subscriptionId)) {
      return res.status(404).send({ error: 'No existe una suscripción de PayPal para esta manada.' });
    }
    if (!process.env.PAYPAL_CLIENT || !process.env.PAYPAL_SECRET || !process.env.PAYPAL_URI) {
      return res.status(503).send({ error: 'Cancelación de PayPal no disponible: faltan credenciales del proveedor.' });
    }
    const response = await axios.post(
      `${process.env.PAYPAL_URI}/v1/billing/subscriptions/${subscriptionId}/cancel`,
      { reason: 'Cancelación solicitada por el padrino' },
      {
        auth: {
          username: process.env.PAYPAL_CLIENT,
          password: process.env.PAYPAL_SECRET,
        },
        headers: { 'Content-Type': 'application/json' },
      },
    );
    return res.send({ mensaje: 'Solicitud de cancelación enviada a PayPal.', result: response.data });
  } catch (error) {
    console.error('PayPal subscription cancellation failed:', error.message);
    return res.status(502).send({ error: 'No se pudo cancelar la suscripción con PayPal.' });
  }
};

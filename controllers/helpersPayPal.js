/* eslint-disable no-console */
const _ = require('lodash');
const axios = require('axios');

const db = require('../DB/index');

const config = {
  headers: {
    'Content-Type': 'application/json',
  },
  auth: {
    username: process.env.PAYPAL_CLIENT,
    password: process.env.PAYPAL_SECRET,
  },
};

function validatePayPalConfig() {
  if (!process.env.PAYPAL_CLIENT || !process.env.PAYPAL_SECRET || !process.env.PAYPAL_URI) {
    throw Object.assign(
      new Error('Pagos PayPal deshabilitados: faltan PAYPAL_CLIENT, PAYPAL_SECRET o PAYPAL_URI.'),
      { statusCode: 503 },
    );
  }
}

/**
 * Crea (o actualiza) la suscripcion de pago de una manada. Antes estos
 * metadatos vivian en la tabla manada; ahora se desacoplan en
 * suscripcion_padrino (1:1 con manada).
 * @param {Object} data Datos de la manada que se suscribe
 * @return {Promise<Object>} la fila de SuscripcionPadrino
 */
async function obtenerOCrearSuscripcion(data) {
  const manadaId = _.get(data, 'manadaId', _.get(data, 'id'));
  const [suscripcion] = await db.SuscripcionPadrino.findOrCreate({
    where: { manadaId },
    defaults: {
      manadaId,
      montoTotal: _.get(data, 'montoTotal', 0),
      statusSubscription: false,
    },
  });
  return suscripcion;
}

/**
 * Funcion para crear un producto en PayPal, el cual se le asociara la
 * informacion de una suscripcion de manada.
 * @param  {Object} data
 * @return {Object} response
 */
exports.createProductManada = async (data) => {
  try {
    validatePayPalConfig();
    const product = {
      name: _.get(data, 'nombre'),
      description: 'Apadrinamiento de animales',
      type: process.env.PRODUCT_TYPE || 'SERVICE',
      category: process.env.PRODUCT_CATEGORY || 'SERVICES',
    };
    const payloadProduct = await axios.post(
      `${process.env.PAYPAL_URI}/v1/catalogs/products`,
      product,
      config,
    );
    const responseProduct = _.get(payloadProduct, 'data');
    const productId = _.get(responseProduct, 'id');
    const suscripcion = await obtenerOCrearSuscripcion(data);
    await suscripcion.update({
      productId,
      responseProduct,
      montoTotal: _.get(data, 'montoTotal', suscripcion.montoTotal),
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('PayPal product creation failed:', error.message);
    throw error;
  }
};

/**
 * Funcion para crear una subscripcion en PayPal, el cual se le asociara la
 * informacion de un plan previamente creado en PayPal.
 * @param  {Object} data
 * @return {Object} response
 */
const createSubscription = async (data) => {
  try {
    validatePayPalConfig();
    if (!process.env.FRONTEND_URL) {
      throw Object.assign(
        new Error('Pagos PayPal deshabilitados: falta configurar FRONTEND_URL.'),
        { statusCode: 503 },
      );
    }
    const subscription = {
      plan_id: _.get(data, 'planId'),
      quantity: 1,
      subscriber: {
        name: {
          given_name: _.get(data, 'nombres'),
          surname: _.get(data, 'apellidos'),
        },
        email_address: _.get(data, 'email'),
      },
      return_url: `${process.env.FRONTEND_URL}/configurar-manada?status=approved&manadaId=${encodeURIComponent(_.get(data, 'id'))}`,
      cancel_url: `${process.env.FRONTEND_URL}/configurar-manada?status=cancelled&manadaId=${encodeURIComponent(_.get(data, 'id'))}`,
    };
    const payloadSubscription = await axios.post(
      `${process.env.PAYPAL_URI}/v1/billing/subscriptions`,
      subscription,
      config,
    );
    const responseSubscription = _.get(payloadSubscription, 'data');
    const subscriptionId = _.get(responseSubscription, 'id');
    const suscripcion = await obtenerOCrearSuscripcion(data);
    await suscripcion.update({
      subscriptionId,
      responseSubscription,
      updatedAt: Date.now(),
    });
    const approvalLink = _.find(_.get(responseSubscription, 'links', []), { rel: 'approve' });
    if (!approvalLink || !approvalLink.href) {
      throw new Error('PayPal no devolvió un enlace de aprobación para la suscripción.');
    }
    return approvalLink.href;
  } catch (error) {
    console.error('PayPal subscription creation failed:', error.message);
    throw error;
  }
};

/**
 * Funcion para crear un plan en PayPal, el cual se le asociara la informacion
 * de un producto previamente creado en PayPal.
 * @param  {Object} data
 * @return {Object} response
 */
exports.createPlanManada = async (data) => {
  try {
    validatePayPalConfig();
    const plan = {
      name: `Subscripción de la manada ${_.get(data, 'nombre')}`,
      product_id: _.get(data, 'productId'),
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
              value: _.toString(_.get(data, 'montoTotal')),
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

    const payloadPlan = await axios.post(
      `${process.env.PAYPAL_URI}/v1/billing/plans`,
      plan,
      config,
    );
    const responsePlan = _.get(payloadPlan, 'data');
    const planId = _.get(responsePlan, 'id');
    const newData = data;
    newData.planId = planId;
    const suscripcion = await obtenerOCrearSuscripcion(data);
    await suscripcion.update({
      planId,
      responsePlan,
      updatedAt: Date.now(),
    });
    const link = await createSubscription(newData);
    return link;
  } catch (error) {
    console.error('PayPal plan creation failed:', error.message);
    throw error;
  }
};

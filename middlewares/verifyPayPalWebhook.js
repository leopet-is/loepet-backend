const axios = require('axios');

module.exports = async (req, res, next) => {
  const {
    PAYPAL_CLIENT,
    PAYPAL_SECRET,
    PAYPAL_URI,
    PAYPAL_WEBHOOK_ID,
  } = process.env;
  if (!PAYPAL_CLIENT || !PAYPAL_SECRET || !PAYPAL_URI || !PAYPAL_WEBHOOK_ID) {
    return res.status(503).json({ error: 'Verificación de webhooks PayPal no configurada.' });
  }

  const signature = {
    auth_algo: req.get('paypal-auth-algo'),
    cert_url: req.get('paypal-cert-url'),
    transmission_id: req.get('paypal-transmission-id'),
    transmission_sig: req.get('paypal-transmission-sig'),
    transmission_time: req.get('paypal-transmission-time'),
    webhook_id: PAYPAL_WEBHOOK_ID,
    webhook_event: req.body,
  };
  if (Object.values(signature).some((value) => !value)) {
    return res.status(400).json({ error: 'Faltan encabezados de firma requeridos por PayPal.' });
  }

  try {
    const response = await axios.post(
      `${PAYPAL_URI}/v1/notifications/verify-webhook-signature`,
      signature,
      {
        auth: { username: PAYPAL_CLIENT, password: PAYPAL_SECRET },
        headers: { 'Content-Type': 'application/json' },
      },
    );
    if (response.data.verification_status !== 'SUCCESS') {
      return res.status(401).json({ error: 'La firma del webhook PayPal no es válida.' });
    }
    return next();
  } catch (error) {
    console.error('No se pudo verificar el webhook de PayPal:', error.message);
    return res.status(502).json({ error: 'No se pudo verificar el evento con PayPal.' });
  }
};

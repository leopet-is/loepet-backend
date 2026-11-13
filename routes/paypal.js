const express = require('express');

const { AsyncWrapper } = require('../helpers');

// Controladores
const paypalController = require('../controllers/paypalController');

// Middlewares
const passport = require('../middlewares/passport');
const { ROL } = require('../constants');
const verifyPayPalWebhook = require('../middlewares/verifyPayPalWebhook');
// Const validations = require("../controllers/validations");

const router = express.Router();

router.get('/availability', paypalController.getAvailability);

const checkDonador = (req, res, next) => {
  if (req.User && req.User.role === ROL.DONADOR.ROL_ID) return next();
  return res.status(403).json({ message: 'Acceso denegado: Permisos insuficientes' });
};

router.post(
  '/verify/subscription',
  verifyPayPalWebhook,
  AsyncWrapper(paypalController.verifySubscription),
);

router.post(
  '/verify/payment/failed',
  verifyPayPalWebhook,
  AsyncWrapper(paypalController.verifyPaymentFailed),
);

router.post(
  '/cancel/subscription',
  verifyPayPalWebhook,
  AsyncWrapper(paypalController.verifyCancelSubscription),
);

router.post(
  '/cancel',
  passport,
  checkDonador,
  AsyncWrapper(paypalController.cancelSubscription),
);

module.exports = router;

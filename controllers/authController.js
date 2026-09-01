/* eslint-disable no-console */
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const dayjs = require('dayjs');

const { USUARIO_ESTADO } = require('../constants');
const db = require('../DB/index');
const { sendActivationEmail } = require('../services/emailService');

/* Url base del enlace de activacion (se le concatena ?token=...). */
const ACTIVATION_URL = process.env.ACTIVATION_URL || 'https://leopet.com/activar-cuenta';

/** Duracion de validez del token de activacion. */
const ACTIVATION_TTL_HOURS = 24;

/**
 * @openapi
 * tags:
 *   - name: Activacion de cuenta
 *
 * /auth/validar-token-activacion:
 *   get:
 *     tags: [Activacion de cuenta]
 *     summary: Valida si un token de activacion existe y no ha expirado
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: Token valido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valido: { type: boolean }
 *                 estado: { type: string }
 *       '400':
 *         description: Token faltante o invalido
 *       '410':
 *         description: Token expirado o ya utilizado
 *
 * /auth/activar-cuenta:
 *   post:
 *     tags: [Activacion de cuenta]
 *     summary: Activa la cuenta de una fundacion estableciendo su contrasena
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, description: 'Minimo 8 caracteres, con minusculas, mayusculas, numero y caracter especial' }
 *     responses:
 *       '200':
 *         description: Cuenta activada exitosamente
 *       '400':
 *         description: Campos invalidos
 *       '410':
 *         description: Token expirado o ya utilizado
 */

/**
 * Busca el registro de token de activacion vigente (no usado) junto con su
 * usuario, siempre que la cuenta siga en PENDIENTE_ACTIVACION.
 * @param  {String} token
 * @return {Object|null} registro de token (con 'usuario') o null
 */
const buscarTokenActivo = (token) => db.TokenActivacion.findOne({
  where: { token, usado: false },
  include: [{
    model: db.Usuario,
    as: 'usuario',
    required: true,
    where: { estado: USUARIO_ESTADO.PENDIENTE_ACTIVACION },
  }],
});

/**
 * Busca un usuario por su token de activacion (solo si sigue pendiente).
 * @param  {String} token
 * @return {Object|null} usuario o null
 */
const findUserByToken = async (token) => {
  const registro = await buscarTokenActivo(token);
  return registro ? registro.usuario : null;
};

/**
 * Valida si el token de activacion es vigente (existe, esta pendiente y no expiro).
 * @param  {String} token
 * @return {Object} { valido: boolean, estado: string }
 */
const validarToken = async (token) => {
  const registro = await buscarTokenActivo(token);

  if (!registro) {
    return { valido: false, estado: 'INVALIDO' };
  }

  if (dayjs().isAfter(dayjs(registro.expires_at))) {
    return { valido: false, estado: 'EXPIRADO' };
  }

  return { valido: true, estado: USUARIO_ESTADO.PENDIENTE_ACTIVACION };
};

/**
 * GET /auth/validar-token-activacion
 * Valida que el token exista y no haya expirado, sin revelar informacion sensible.
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.validarTokenActivacion = async (req, res) => {
  const { token } = req.query;

  const { valido, estado } = await validarToken(token);

  if (valido) {
    return res.send({ valido: true, estado });
  }

  if (estado === 'EXPIRADO') {
    return res.status(410).send({
      valido: false,
      error: 'El enlace de activacion ha expirado. Solicita uno nuevo al administrador.',
    });
  }

  return res.status(400).send({
    valido: false,
    error: 'El enlace de activacion no es valido o ya fue utilizado.',
  });
};

/**
 * POST /auth/activar-cuenta
 * Verifica nuevamente el token, hashea la nueva contrasena y activa la cuenta.
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.activarCuenta = async (req, res) => {
  const { token, password } = req.body;

  const registro = await buscarTokenActivo(token);

  if (!registro) {
    return res.status(400).send({
      error: 'El enlace de activacion no es valido o ya fue utilizado.',
    });
  }

  if (dayjs().isAfter(dayjs(registro.expires_at))) {
    return res.status(410).send({
      error: 'El enlace de activacion ha expirado. Solicita uno nuevo al administrador.',
    });
  }

  const { usuario } = registro;
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(password, salt);

  /* Se actualiza el usuario y se invalida el token de forma atomica: si uno de
   * los dos falla, la cuenta no queda a medias. */
  const transaction = await db.sequelize.transaction();
  try {
    await db.Usuario.update(
      {
        password: hash,
        estado: USUARIO_ESTADO.ACTIVO,
        updatedAt: new Date(),
      },
      { where: { id: usuario.id }, transaction },
    );

    await db.TokenActivacion.update(
      { usado: true, updatedAt: new Date() },
      { where: { id: registro.id }, transaction },
    );

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  return res.send({
    mensaje: 'Cuenta activada exitosamente. Ya puedes iniciar sesion.',
  });
};

/**
 * Genera un token de activacion seguro (64 caracteres hex) con expiracion de 24h.
 * @return {Object} { token, expiresAt }
 */
const generateActivationToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = dayjs().add(ACTIVATION_TTL_HOURS, 'hour').toDate();
  return { token, expiresAt };
};

/**
 * Crea el usuario de fundacion en estado PENDIENTE_ACTIVACION con un token de
 * activacion valido por 24h. La creacion puede ejecutarse dentro de una
 * transaccion para garantizar atomicidad con el resto del flujo de aprobacion.
 * @param  {Object} data         { email, nombres, apellidos, cedula, telefono, direccion }
 * @param  {Object} [transaction] transaccion de Sequelize (opcional)
 * @return {Object} { usuario, token, expiresAt }
 */
const crearUsuarioPendiente = async (data, transaction) => {
  const { token, expiresAt } = generateActivationToken();
  const options = transaction ? { transaction } : {};

  const usuario = await db.Usuario.create({
    cedula: data.cedula,
    nombres: data.nombres,
    apellidos: data.apellidos,
    telefono: data.telefono,
    direccion: data.direccion,
    email: data.email,
    role: 2, // ADMIN_FUND
    estado: USUARIO_ESTADO.PENDIENTE_ACTIVACION,
    password: null,
  }, options);

  await db.TokenActivacion.create({
    usuario_id: usuario.id,
    token,
    expires_at: expiresAt,
    usado: false,
  }, options);

  return { usuario, token, expiresAt };
};

/**
 * Envia el correo de activacion con el enlace unico de la cuenta.
 * @param  {Object} usuario      usuario persistido (con email y nombres)
 * @param  {Object} tokenData    { token, expiresAt }
 * @return {Object} result de sendMail ({ messageId, driver })
 */
const enviarCorreoActivacion = (usuario, { token, expiresAt }) => {
  const activationUrl = `${ACTIVATION_URL}?token=${token}`;
  return sendActivationEmail({
    to: usuario.email,
    nombre: `${usuario.nombres} ${usuario.apellidos}`,
    url: activationUrl,
    expiresAt,
  });
};

module.exports.findUserByToken = findUserByToken;
module.exports.validarToken = validarToken;
module.exports.generateActivationToken = generateActivationToken;
module.exports.crearUsuarioPendiente = crearUsuarioPendiente;
module.exports.enviarCorreoActivacion = enviarCorreoActivacion;

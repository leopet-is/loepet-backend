const { Resend } = require('resend');
const dayjs = require('dayjs');
require('dotenv').config();

// Drivers de correo:
//   'resend'  -> envia via la API de Resend (https://resend.com). Requiere RESEND_API_KEY.
//   'console' -> modo seguro sin infraestructura: solo imprime en los logs.
// Sin RESEND_API_KEY se usa 'console' (mismo patron que PayPal:
// sin credenciales -> mock automatico).
const getDriver = () => (process.env.RESEND_API_KEY ? 'resend' : 'console');

const getFrom = () => process.env.RESEND_FROM
  || process.env.MAIL_FROM
  || 'LEOPET <no-reply@leopet.app>';

// Resend en modo de prueba usa el dominio resend.dev y solo permite enviar al
// correo asociado a la cuenta. Con un dominio propio se conserva el destinatario real.
const isResendTestSender = () => getFrom().toLowerCase().includes('@resend.dev');

const getRecipient = (to, driver) => (
  driver === 'resend' && isResendTestSender() && process.env.RESEND_TO
    ? process.env.RESEND_TO
    : to
);

let resendClient;

const getResendClient = () => {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

const sendMail = async ({
  to, subject, text, html,
}) => {
  const driver = getDriver();
  const recipient = getRecipient(to, driver);
  const mail = {
    from: getFrom(),
    to: recipient,
    subject,
    text,
    html: html || text,
  };

  if (driver === 'console') {
    console.log('[MAIL:console] Correo no enviado (modo consola):');
    console.log(JSON.stringify(mail, null, 2));
    return { messageId: 'console-message-id', driver };
  }

  const { data, error } = await getResendClient().emails.send(mail);
  if (error) throw error;
  console.log(`Correo enviado (${driver}): ${data.id}`);
  return { messageId: data.id, driver };
};

/**
 * Envia el correo de activacion de cuenta de fundacion con el enlace unico.
 * @param  {Object}  params
 * @param  {String}  params.to       correo receptor
 * @param  {String}  params.nombre   nombre del contacto (para saludar)
 * @param  {String}  params.url      enlace de activacion con el token
 * @param  {Date|String} params.expiresAt fecha limite de validez del enlace
 * @return {Object}  result de sendMail ({ messageId, driver })
 */
const sendActivationEmail = async ({
  to, nombre, url, expiresAt,
}) => {
  const activacionUrl = url || process.env.ACTIVATION_URL || 'https://leopet.com/activar-cuenta';
  const expira = dayjs(expiresAt).format('DD/MM/YYYY HH:mm');

  const subject = 'Activa tu cuenta de fundacion en LEOPET';
  const text = `Hola ${nombre || 'Fundacion'},

Tu solicitud de fundacion fue aprobada. Para activar tu cuenta y definir tu contrasena, abre el siguiente enlace:

${activacionUrl}

Este enlace expira el ${expira}.

Si no solicitaste este registro, ignora este correo.`;
  const html = `<p>Hola <strong>${nombre || 'Fundacion'}</strong>,</p>
<p>Tu solicitud de fundacion fue aprobada. Para activar tu cuenta y definir tu contrasena, haz clic en el siguiente enlace:</p>
<p><a href="${activacionUrl}">Activar mi cuenta</a></p>
<p>Este enlace expira el <strong>${expira}</strong>.</p>
<p>Si no solicitaste este registro, ignora este correo.</p>`;

  return sendMail({
    to,
    subject,
    text,
    html,
  });
};

/**
 * Envia el correo de rechazo de una solicitud de fundacion.
 * @param  {Object}  params
 * @param  {String}  params.to       correo receptor
 * @param  {String}  params.nombre   nombre del contacto (para saludar)
 * @param  {String}  params.motivo   motivo informado por el administrador
 * @return {Object}  result de sendMail ({ messageId, driver })
 */
const sendRejectionEmail = async ({ to, nombre, motivo }) => {
  const subject = 'Actualizacion de tu solicitud de fundacion en LEOPET';
  const text = `Hola ${nombre || 'Fundacion'},

Tu solicitud de fundacion no fue aprobada en esta ocasion.

Motivo: ${motivo}

Si necesitas mas informacion, contacta al equipo de LEOPET.`;
  const html = `<p>Hola <strong>${nombre || 'Fundacion'}</strong>,</p>
<p>Tu solicitud de fundacion no fue aprobada en esta ocasion.</p>
<p><strong>Motivo:</strong> ${motivo}</p>
<p>Si necesitas mas informacion, contacta al equipo de LEOPET.</p>`;

  return sendMail({
    to,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendMail,
  sendActivationEmail,
  sendRejectionEmail,
  getRecipient,
  getDriver,
};

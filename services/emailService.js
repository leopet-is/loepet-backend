const { Resend } = require('resend');
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
  const mail = {
    from: getFrom(),
    to,
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

module.exports = {
  sendMail,
  getDriver,
};

require('dotenv').config();

const { sendMail, getRecipient, getDriver } = require('../services/emailService');

(async () => {
  try {
    const driver = getDriver();
    const configuredTo = process.env.MAIL_TO || 'dev@test.com';
    const to = getRecipient(configuredTo, driver);
    const result = await sendMail({
      to: configuredTo,
      subject: 'Prueba de correo LEOPET',
      text: 'Este es un correo de prueba enviado desde desarrollo.',
      html: '<h1>Hola</h1><p>Este es un correo de prueba de LEOPET.</p>',
    });
    console.log('Resultado:', JSON.stringify({ ...result, to }, null, 2));
    if (driver === 'console') {
      console.log('Para probar el envio real, agrega RESEND_API_KEY en .env (https://resend.com/api-keys).');
    } else {
      console.log('Revisa la bandeja del correo en el dashboard de Resend.');
    }
  } catch (err) {
    console.error('Error enviando correo:', err);
    process.exit(1);
  }
})();
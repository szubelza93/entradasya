const { sendEmail } = require('./email.service');
const purchaseConfirmation = require('../templates/purchaseConfirmation');

async function sendPurchaseConfirmation(data) {
  const html = purchaseConfirmation(data);

  return sendEmail({
    to: data.to,
    subject: `Confirmación de compra - ${data.eventName}`,
    html
  });
}

async function sendTestEmail(to) {
  const html = `
    <h2>EntradasYa</h2>
    <p>El servicio de notificaciones está funcionando correctamente.</p>
    <p>Este es un correo de prueba enviado mediante Yahoo SMTP y Nodemailer.</p>
  `;

  return sendEmail({
    to,
    subject: 'Prueba de notificaciones - EntradasYa',
    html
  });
}

module.exports = {
  sendPurchaseConfirmation,
  sendTestEmail
};

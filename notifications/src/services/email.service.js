const transporter = require('../config/mailer');

async function verifyConnection() {
  return transporter.verify();
}

async function sendEmail({ to, subject, html }) {
  const result = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html
  });

  console.log('Correo enviado correctamente:', {
    to,
    messageId: result.messageId
  });

  return result;
}

module.exports = {
  verifyConnection,
  sendEmail
};

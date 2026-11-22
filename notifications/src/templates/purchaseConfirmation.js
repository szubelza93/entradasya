const escapeHtml = require('../utils/escapeHtml');

function purchaseConfirmation({
  customerName,
  orderId,
  eventName,
  ticketsUrl
}) {
  const name = escapeHtml(customerName);
  const order = escapeHtml(orderId);
  const event = escapeHtml(eventName);
  const safeUrl = escapeHtml(ticketsUrl);

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de compra</title>
    </head>

    <body style="
      margin: 0;
      padding: 30px;
      background-color: #f3f4f6;
      font-family: Arial, sans-serif;
    ">

      <div style="
        max-width: 600px;
        margin: auto;
        background-color: #ffffff;
        border-radius: 10px;
        overflow: hidden;
      ">

        <div style="
          background-color: #dc2626;
          padding: 25px;
          text-align: center;
          color: white;
        ">
          <h1 style="margin: 0;">EntradasYa</h1>
          <p>Confirmación de compra</p>
        </div>

        <div style="padding: 30px; color: #333333;">

          <h2>¡Gracias por tu compra, ${name}!</h2>

          <p>
            Tu compra se ha realizado correctamente.
          </p>

          <p>
            <strong>Evento:</strong> ${event}
          </p>

          <p>
            <strong>Número de orden:</strong> ${order}
          </p>

          <p>
            Puedes acceder a tus entradas mediante el siguiente enlace:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${safeUrl}" style="
              display: inline-block;
              padding: 14px 25px;
              background-color: #dc2626;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            ">
              Ver mis entradas
            </a>
          </div>

          <p>
            Presenta el código QR de tu entrada al momento de ingresar
            al evento.
          </p>

          <p style="font-size: 13px; color: #777777;">
            Este correo fue generado automáticamente por EntradasYa.
            Por favor, no respondas a este mensaje.
          </p>

        </div>

      </div>

    </body>
    </html>
  `;
}

module.exports = purchaseConfirmation;

const notificationService = require('../services/notification.service');

function isValidEmail(email) {
  return typeof email === 'string' &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidHttpUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

async function sendTest(req, res, next) {
  try {
    const { to } = req.body || {};

    if (!isValidEmail(to)) {
      return res.status(400).json({
        message: 'Debes proporcionar un correo electrónico válido.'
      });
    }

    await notificationService.sendTestEmail(to);

    return res.status(200).json({
      message: 'Correo de prueba enviado correctamente.'
    });

  } catch (error) {
    next(error);
  }
}

async function sendPurchaseConfirmation(req, res, next) {
  try {
    const {
      to,
      customerName,
      orderId,
      eventName,
      ticketsUrl
    } = req.body || {};

    if (
      !isValidEmail(to) ||
      typeof customerName !== 'string' ||
      customerName.trim().length === 0 ||
      customerName.length > 100 ||
      typeof orderId !== 'string' ||
      orderId.trim().length === 0 ||
      orderId.length > 100 ||
      typeof eventName !== 'string' ||
      eventName.trim().length === 0 ||
      eventName.length > 200 ||
      !isValidHttpUrl(ticketsUrl)
    ) {
      return res.status(400).json({
        message: 'Los datos de la confirmación de compra son inválidos.'
      });
    }

    await notificationService.sendPurchaseConfirmation({
      to,
      customerName,
      orderId,
      eventName,
      ticketsUrl
    });

    return res.status(200).json({
      message: 'Confirmación de compra enviada correctamente.'
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  sendTest,
  sendPurchaseConfirmation
};

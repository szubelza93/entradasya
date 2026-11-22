const crypto = require('crypto');

function authenticateOrders(req, res, next) {
  const expected = process.env.ORDERS_API_KEY || '';
  const supplied = req.get('x-orders-key') || '';
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);

  if (expectedBuffer.length < 32 || /replace_with|placeholder/i.test(expected)) {
    return res.status(503).json({
      message: 'La autenticación de orders no está configurada'
    });
  }

  if (
    expectedBuffer.length !== suppliedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)
  ) {
    return res.status(401).json({ message: 'Solicitud interna no autorizada' });
  }

  next();
}

module.exports = authenticateOrders;

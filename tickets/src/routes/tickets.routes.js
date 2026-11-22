const express = require('express');

const controller = require('../controllers/tickets.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const authenticateOrders = require('../middlewares/orders-auth');

const router = express.Router();

// La emisión se realiza desde orders después de aprobarse el pago.
router.post(
  '/generate',
  authenticateOrders,
  controller.generate
);

// Entradas del cliente autenticado.
router.get(
  '/my',
  authenticate,
  controller.myTickets
);

// Consulta de entradas de una compra.
router.get(
  '/order/:orderId',
  authenticate,
  controller.getByOrder
);

// Descarga de una entrada.
router.get(
  '/:id/download',
  authenticate,
  controller.download
);

// Validación de códigos solicitada por checkin.
router.post(
  '/validate',
  authenticate,
  authorize('portero'),
  controller.validate
);

// Registrar que la entrada fue utilizada.
router.post(
  '/:code/check-in',
  authenticate,
  authorize('portero'),
  controller.checkIn
);

module.exports = router;

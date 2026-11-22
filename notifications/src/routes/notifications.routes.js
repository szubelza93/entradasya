const express = require('express');

const controller = require('../controllers/notifications.controller');
const authenticateOrders = require('../middlewares/orders-auth');

const router = express.Router();

router.post('/test', controller.sendTest);

router.post(
  '/purchase-confirmation',
  authenticateOrders,
  controller.sendPurchaseConfirmation
);

module.exports = router;

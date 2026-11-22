
const router = require('express').Router();

const controller = require('../controllers/events.controller');

const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');

const schemas = require('../validators/event.validator');

const upload = require('../middlewares/upload');
const requireEventImage = require('../middlewares/requireEventImage');
const parseEventMultipart = require('../middlewares/parseEventMultipart');
const validateImageSignature = require('../middlewares/validateImageSignature');
const authenticateOrders = require('../middlewares/orders-auth');

// =====================================
// 1. CARTELERA PÚBLICA
// =====================================

// Listar eventos publicados
router.get('/', controller.listPublished);

// Eventos publicados, incluidos los que ya comenzaron, para la pantalla de portero.
router.get(
  '/check-in-events',
  authenticate,
  authorize('portero'),
  controller.checkInEvents
);

// =====================================
// 2. GESTIÓN DE EVENTOS
// =====================================

// Listar eventos del organizador
router.get(
  '/mine',
  authenticate,
  authorize('organizador'),
  controller.mine
);

// Crear evento

router.post(
  '/',
  authenticate,
  authorize('organizador'),
  upload.single('imagen'),
  requireEventImage,
  validateImageSignature,
  parseEventMultipart,
  validate(schemas.createEventSchema),
  controller.create
);


// Consultar evento propio para administración
router.get(
  '/:id/manage',
  authenticate,
  authorize('organizador'),
  validate(schemas.eventIdParamsSchema),
  controller.manage
);

// Actualizar evento
router.patch(
  '/:id',
  authenticate,
  authorize('organizador'),
  validate(schemas.eventIdParamsSchema),
  validate(schemas.updateEventSchema),
  controller.update
);

// Publicar evento
router.post(
  '/:id/publish',
  authenticate,
  authorize('organizador'),
  validate(schemas.eventIdParamsSchema),
  controller.publish
);

// Cancelar evento
router.post(
  '/:id/cancel',
  authenticate,
  authorize('organizador'),
  validate(schemas.eventIdParamsSchema),
  controller.cancel
);

// =====================================
// 3. GESTIÓN DE SECTORES
// =====================================

// Agregar sector
router.post(
  '/:id/sectors',
  authenticate,
  authorize('organizador'),
  validate(schemas.eventIdParamsSchema),
  validate(schemas.createSectorSchema),
  controller.addSector
);

// Actualizar sector
router.patch(
  '/:id/sectors/:sectorId',
  authenticate,
  authorize('organizador'),
  validate(schemas.sectorIdParamsSchema),
  validate(schemas.updateSectorSchema),
  controller.updateSector
);

// Reservas internas solicitadas por orders.
router.post(
  '/:id/reserve',
  authenticateOrders,
  controller.reserve
);

router.post(
  '/:id/release',
  authenticateOrders,
  controller.release
);

// Consultar detalle público
router.get(
  '/:id',
  validate(schemas.eventIdParamsSchema),
  controller.getPublished
);

module.exports = router;



const service = require('../services/events.service');

const {
  uploadImage,
  deleteImage
} = require('../utils/cloudinaryUpload');

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// =====================================
// 1. CARTELERA PÚBLICA
// =====================================

// GET /api/events
exports.listPublished = asyncHandler(async (req, res) => {
  const page = Math.max(
    1,
    parseInt(req.query.page, 10) || 1
  );

  const limit = Math.min(
    50,
    Math.max(1, parseInt(req.query.limit, 10) || 10)
  );

  const result = await service.listPublished({
    page,
    limit,
    search: req.query.search
  });

  res.json(result);
});

// GET /api/events/check-in-events
exports.checkInEvents = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const result = await service.listCheckInEvents({ page, limit });

  res.json(result);
});

// GET /api/events/:id
exports.getPublished = asyncHandler(async (req, res) => {
  const event = await service.getPublishedById(
    req.params.id
  );

  res.json({
    data: event
  });
});

// =====================================
// 2. GESTIÓN DE EVENTOS
// =====================================

// POST /api/events
// Crear evento y subir imagen a Cloudinary
exports.create = asyncHandler(async (req, res) => {
  const organizerId = req.user.sub || req.user.id;

  let uploadedImage;

  try {
    // 1. Subir imagen a Cloudinary
    uploadedImage = await uploadImage(req.file);

    // 2. Crear evento y guardar la URL de Cloudinary
    const event = await service.createEvent(
      organizerId,
      req.body,
      uploadedImage.url
    );

    // 3. Responder al cliente
    res.status(201).json({
      message: 'Evento creado correctamente.',
      data: event
    });

  } catch (error) {
    // Si falla la creación del evento,
    // intentar eliminar la imagen de Cloudinary
    if (uploadedImage?.publicId) {
      try {
        await deleteImage(uploadedImage.publicId);
      } catch (cleanupError) {
        console.error(
          'Error al eliminar imagen de Cloudinary:',
          cleanupError
        );
      }
    }

    throw error;
  }
});

// GET /api/events/mine
// Listar eventos del organizador
exports.mine = asyncHandler(async (req, res) => {
  const organizerId = req.user.sub || req.user.id;

  const events = await service.listOrganizerEvents(
    organizerId
  );

  res.json({
    data: events
  });
});

// GET /api/events/:id/manage
// Consultar evento propio para administración
exports.manage = asyncHandler(async (req, res) => {
  const organizerId = req.user.sub || req.user.id;

  const event = await service.getManagedEvent(
    organizerId,
    req.params.id
  );

  res.json({
    data: event
  });
});

// PATCH /api/events/:id
// Actualizar evento
exports.update = asyncHandler(async (req, res) => {
  const organizerId = req.user.sub || req.user.id;

  const event = await service.updateEvent(
    organizerId,
    req.params.id,
    req.body
  );

  res.json({
    message: 'Evento actualizado correctamente.',
    data: event
  });
});

// POST /api/events/:id/publish
// Publicar evento
exports.publish = asyncHandler(async (req, res) => {
  const organizerId = req.user.sub || req.user.id;

  const event = await service.publishEvent(
    organizerId,
    req.params.id
  );

  res.json({
    message: 'Evento publicado correctamente.',
    data: event
  });
});

// POST /api/events/:id/cancel
// Cancelar evento
exports.cancel = asyncHandler(async (req, res) => {
  const organizerId = req.user.sub || req.user.id;

  const event = await service.cancelEvent(
    organizerId,
    req.params.id
  );

  res.json({
    message: 'Evento cancelado correctamente.',
    data: event
  });
});

// =====================================
// 3. GESTIÓN DE SECTORES
// =====================================

// POST /api/events/:id/sectors
// Agregar sector
exports.addSector = asyncHandler(async (req, res) => {
  const organizerId = req.user.sub || req.user.id;

  const sector = await service.addSector(
    organizerId,
    req.params.id,
    req.body
  );

  res.status(201).json({
    message: 'Sector agregado correctamente.',
    data: sector
  });
});

// PATCH /api/events/:id/sectors/:sectorId
// Actualizar sector
exports.updateSector = asyncHandler(async (req, res) => {
  const organizerId = req.user.sub || req.user.id;

  const sector = await service.updateSector(
    organizerId,
    req.params.id,
    req.params.sectorId,
    req.body
  );

  res.json({
    message: 'Sector actualizado correctamente.',
    data: sector
  });
});

// POST /api/events/:id/reserve
exports.reserve = asyncHandler(async (req, res) => {
  const reservation = await service.reserveTickets(
    req.params.id,
    req.body
  );

  res.status(201).json(reservation);
});

// POST /api/events/:id/release
exports.release = asyncHandler(async (req, res) => {
  const result = await service.releaseTickets(
    req.params.id,
    req.body
  );

  res.json(result);
});



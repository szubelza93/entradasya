
const { Op } = require('sequelize');
const { Event, Sector, Reservation, sequelize } = require('../models');

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// 1. Listar eventos publicados
async function listPublished({ page = 1, limit = 10, search }) {
  const offset = (page - 1) * limit;

  const where = {
    estado: 'publicado',
    fecha: { [Op.gte]: new Date() }
  };

  if (search) {
    where.nombre = {
      [Op.iLike]: `%${search}%`
    };
  }

  const result = await Event.findAndCountAll({
    where,
    include: [{
      model: Sector,
      as: 'sectores',
      where: { activo: true },
      required: false
    }],
    order: [['fecha', 'ASC']],
    limit,
    offset,
    distinct: true
  });

  return {
    total: result.count,
    page,
    limit,
    data: result.rows
  };
}

async function listCheckInEvents({ page = 1, limit = 50 }) {
  const result = await Event.findAndCountAll({
    where: { estado: 'publicado' },
    include: [{
      model: Sector,
      as: 'sectores',
      where: { activo: true },
      required: false
    }],
    order: [['fecha', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true
  });

  return {
    total: result.count,
    page,
    limit,
    data: result.rows
  };
}

// 2. Consultar detalle de evento publicado
async function getPublishedById(id) {
  const event = await Event.findOne({
    where: {
      id,
      estado: 'publicado'
    },
    include: [{
      model: Sector,
      as: 'sectores',
      where: { activo: true },
      required: false
    }]
  });

  if (!event) {
    throw new HttpError(404, 'Evento no encontrado.');
  }

  return event;
}

// 3. Crear evento

async function createEvent(organizerId, data, imageUrl) {
  const { sectores = [], ...eventData } = data;

  return Event.sequelize.transaction(async transaction => {
    const event = await Event.create({
      ...eventData,
      fecha: new Date(eventData.fecha),
      imagenUrl: imageUrl,
      organizerId,
      estado: 'borrador'
    }, { transaction });

    if (sectores.length > 0) {
      await Sector.bulkCreate(
        sectores.map(sector => ({
          ...sector,
          eventId: event.id
        })),
        { transaction }
      );
    }

    return Event.findByPk(event.id, {
      include: [{
        model: Sector,
        as: 'sectores'
      }],
      transaction
    });
  });
}


// 4. Listar eventos del organizador
async function listOrganizerEvents(organizerId) {
  return Event.findAll({
    where: { organizerId },
    include: [{
      model: Sector,
      as: 'sectores'
    }],
    order: [['createdAt', 'DESC']]
  });
}

// 5. Obtener evento para administración
async function getManagedEvent(organizerId, id) {
  const event = await Event.findOne({
    where: {
      id,
      organizerId
    },
    include: [{
      model: Sector,
      as: 'sectores'
    }]
  });

  if (!event) {
    throw new HttpError(404, 'Evento no encontrado.');
  }

  return event;
}

// 6. Actualizar evento
async function updateEvent(organizerId, id, data) {
  const event = await getManagedEvent(organizerId, id);

  if (event.estado !== 'borrador') {
    throw new HttpError(
      409,
      'Solo se pueden editar eventos en borrador.'
    );
  }

  await event.update({
    ...data,
    ...(data.fecha ? { fecha: new Date(data.fecha) } : {})
  });

  return getManagedEvent(organizerId, id);
}

// 7. Publicar evento
async function publishEvent(organizerId, id) {
  const event = await getManagedEvent(organizerId, id);

  if (event.estado !== 'borrador') {
    throw new HttpError(
      409,
      'Solo se puede publicar un evento en borrador.'
    );
  }

  if (new Date(event.fecha) <= new Date()) {
    throw new HttpError(
      400,
      'La fecha del evento debe ser futura.'
    );
  }

  const activeSectors = event.sectores.filter(
    sector => sector.activo
  );

  if (activeSectors.length === 0) {
    throw new HttpError(
      400,
      'Agrega al menos un sector activo antes de publicar.'
    );
  }

  await event.update({
    estado: 'publicado'
  });

  return getManagedEvent(organizerId, id);
}

// 8. Cancelar evento
async function cancelEvent(organizerId, id) {
  const event = await getManagedEvent(organizerId, id);

  if (event.estado === 'cancelado') {
    throw new HttpError(409, 'El evento ya está cancelado.');
  }

  await event.update({
    estado: 'cancelado'
  });

  return getManagedEvent(organizerId, id);
}

// 9. Agregar sector
async function addSector(organizerId, eventId, data) {
  const event = await getManagedEvent(organizerId, eventId);

  if (event.estado !== 'borrador') {
    throw new HttpError(
      409,
      'Solo se pueden agregar sectores en borrador.'
    );
  }

  return Sector.create({
    ...data,
    eventId
  });
}

// 10. Actualizar sector
async function updateSector(
  organizerId,
  eventId,
  sectorId,
  data
) {
  const event = await getManagedEvent(organizerId, eventId);

  if (event.estado !== 'borrador') {
    throw new HttpError(
      409,
      'Solo se pueden modificar sectores en borrador.'
    );
  }

  const sector = await Sector.findOne({
    where: {
      id: sectorId,
      eventId
    }
  });

  if (!sector) {
    throw new HttpError(404, 'Sector no encontrado.');
  }

  await sector.update(data);

  return sector;
}

function positiveInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

async function reserveTickets(eventId, data) {
  const parsedEventId = positiveInteger(eventId);
  const parsedSectorId = positiveInteger(data?.sectorId);
  const quantity = positiveInteger(data?.quantity);
  const orderId = data?.orderId == null ? '' : String(data.orderId);

  if (!parsedEventId || !parsedSectorId || !quantity || !orderId || orderId.length > 120) {
    throw new HttpError(400, 'Los datos de la reserva son inválidos.');
  }

  return sequelize.transaction(async transaction => {
    const event = await Event.findOne({
      where: { id: parsedEventId, estado: 'publicado' },
      transaction
    });

    if (!event) {
      throw new HttpError(404, 'Evento no disponible.');
    }

    const sector = await Sector.findOne({
      where: {
        id: parsedSectorId,
        eventId: parsedEventId,
        activo: true
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!sector) {
      throw new HttpError(404, 'Sector no disponible.');
    }

    const previousReservation = await Reservation.findOne({
      where: { orderItemId: orderId },
      transaction
    });

    if (previousReservation) {
      if (
        previousReservation.eventId !== parsedEventId ||
        previousReservation.sectorId !== parsedSectorId ||
        previousReservation.cantidad !== quantity ||
        previousReservation.estado !== 'reserved'
      ) {
        throw new HttpError(409, 'La orden ya tiene una reserva incompatible.');
      }

      return reservationDetails(event, sector, quantity);
    }

    const reserved = Number(await Reservation.sum('cantidad', {
      where: {
        eventId: parsedEventId,
        sectorId: parsedSectorId,
        estado: 'reserved'
      },
      transaction
    }) || 0);

    if (Number(sector.cupo) - reserved < quantity) {
      throw new HttpError(409, 'Agotado: No hay cupo suficiente.');
    }

    await Reservation.create({
      orderItemId: orderId,
      eventId: parsedEventId,
      sectorId: parsedSectorId,
      cantidad: quantity,
      estado: 'reserved'
    }, { transaction });

    return reservationDetails(event, sector, quantity);
  });
}

function reservationDetails(event, sector, quantity) {
  return {
    success: true,
    total: Number((Number(sector.precio) * quantity).toFixed(2)),
    sectorName: sector.nombre,
    event: {
      id: event.id,
      name: event.nombre,
      date: event.fecha,
      place: event.lugar
    }
  };
}

async function releaseTickets(eventId, data) {
  const parsedEventId = positiveInteger(eventId);
  const orderId = data?.orderId == null ? '' : String(data.orderId);

  if (!parsedEventId || !orderId || orderId.length > 120) {
    throw new HttpError(400, 'Los datos para liberar la reserva son inválidos.');
  }

  return sequelize.transaction(async transaction => {
    const reservation = await Reservation.findOne({
      where: {
        eventId: parsedEventId,
        orderItemId: orderId
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!reservation) {
      throw new HttpError(404, 'No se encontró la reserva de la orden.');
    }

    if (reservation.estado === 'reserved') {
      reservation.estado = 'released';
      await reservation.save({ transaction });
    }

    return { success: true };
  });
}

module.exports = {
  listPublished,
  listCheckInEvents,
  getPublishedById,
  createEvent,
  listOrganizerEvents,
  getManagedEvent,
  updateEvent,
  publishEvent,
  cancelEvent,
  addSector,
  updateSector,
  reserveTickets,
  releaseTickets
};


const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

const sequelize = require('../config/sequelize');
const { Ticket } = require('../models');

const generateTicketCode = require('../utils/generateTicketCode');
const generateTicketPdf = require('../utils/generateTicketPdf');
const {
  validateGenerationData,
  validateOrderLookup,
  validateTicketId,
  normalizeTicketCode
} = require('../validators/tickets.validator');

const storageDirectory = path.resolve(
  process.env.TICKETS_STORAGE || 'storage/tickets'
);

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function createTickets(data) {
  validateGenerationData(data);

  const existing = await Ticket.findAll({
    where: {
      orderId: data.orderId,
      itemId: {
        [Op.in]: data.tickets.map(item => item.itemId)
      }
    }
  });

  // Si todos ya existen, devolvemos las entradas anteriores.
  if (existing.length === data.tickets.length) {
    return existing.map(serializeTicket);
  }

  // Evitamos completar silenciosamente una compra parcialmente emitida.
  if (existing.length > 0) {
    throw createError(
      'La compra ya tiene una emisión parcial. Se requiere revisión.',
      409
    );
  }

  const generatedFiles = [];
  const generatedTickets = [];

  try {
    for (const item of data.tickets) {
      const code = generateTicketCode();

      const fileName = `${code}.pdf`;
      const pdfPath = path.join(storageDirectory, fileName);

      const ticketData = {
        code,
        orderId: data.orderId,
        itemId: item.itemId,
        customerId: data.customerId,
        eventId: data.event.id,
        eventName: data.event.name,
        eventDate: data.event.date,
        eventPlace: data.event.place,
        sectorId: item.sectorId,
        sectorName: item.sectorName,
        seatNumber: item.seatNumber || null,
        pdfPath
      };

      generatedFiles.push(pdfPath);
      await generateTicketPdf(ticketData, pdfPath);
      generatedTickets.push(ticketData);
    }

    const transaction = await sequelize.transaction();

    try {
      const tickets = await Ticket.bulkCreate(
        generatedTickets,
        {
          transaction,
          returning: true
        }
      );

      await transaction.commit();

      return tickets.map(serializeTicket);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    // Si falla la operación, eliminamos los PDF creados.
    await Promise.all(
      generatedFiles.map(file =>
        fs.promises.unlink(file).catch(() => {})
      )
    );

    throw error;
  }
}

function serializeTicket(ticket) {
  const data = ticket.get({ plain: true });
  delete data.pdfPath;
  return data;
}

async function getCustomerTickets(customerId) {
  return Ticket.findAll({
    where: { customerId },
    attributes: {
      exclude: ['pdfPath']
    },
    order: [['createdAt', 'DESC']]
  });
}

async function getTicketsByOrder(orderId, customerId) {
  const numericOrderId = validateOrderLookup(orderId, customerId);

  return Ticket.findAll({
    where: { orderId: numericOrderId, customerId },
    attributes: {
      exclude: ['pdfPath']
    },
    order: [['createdAt', 'ASC']]
  });
}

async function getTicketForDownload(ticketId, customerId) {
  const id = validateTicketId(ticketId, customerId);

  const ticket = await Ticket.findOne({
    where: {
      id,
      customerId
    }
  });

  if (!ticket) {
    throw createError('Entrada no encontrada', 404);
  }

  if (ticket.status === 'cancelada') {
    throw createError('La entrada está cancelada', 409);
  }

  if (!fs.existsSync(ticket.pdfPath)) {
    throw createError('El archivo PDF no está disponible', 404);
  }

  return ticket;
}

async function validateTicket(code) {
  const normalizedCode = normalizeTicketCode(code);

  const ticket = await Ticket.findOne({
    where: { code: normalizedCode }
  });

  if (!ticket) {
    return {
      exists: false,
      valid: false,
      message: 'La entrada no existe'
    };
  }

  const valid = ticket.status === 'emitida';

  return {
    exists: true,
    valid,
    message: valid
      ? 'Entrada válida'
      : ticket.status === 'usada'
        ? 'La entrada ya fue utilizada'
        : 'La entrada está cancelada',
    ticket: {
      id: ticket.id,
      code: ticket.code,
      eventId: ticket.eventId,
      eventName: ticket.eventName,
      eventDate: ticket.eventDate,
      eventPlace: ticket.eventPlace,
      sectorName: ticket.sectorName,
      seatNumber: ticket.seatNumber,
      status: ticket.status,
      usedAt: ticket.usedAt
    }
  };
}

async function checkInTicket(code) {
  const normalizedCode = normalizeTicketCode(code);

  const transaction = await sequelize.transaction();

  try {
    const ticket = await Ticket.findOne({
      where: { code: normalizedCode },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!ticket) {
      throw createError('La entrada no existe', 404);
    }

    if (ticket.status !== 'emitida') {
      throw createError(
        ticket.status === 'usada'
          ? 'La entrada ya fue utilizada'
          : 'La entrada está cancelada',
        409
      );
    }

    ticket.status = 'usada';
    ticket.usedAt = new Date();

    await ticket.save({ transaction });

    await transaction.commit();

    return {
      code: ticket.code,
      status: ticket.status,
      usedAt: ticket.usedAt,
      eventName: ticket.eventName
    };
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
}

module.exports = {
  createTickets,
  getCustomerTickets,
  getTicketsByOrder,
  getTicketForDownload,
  validateTicket,
  checkInTicket
};

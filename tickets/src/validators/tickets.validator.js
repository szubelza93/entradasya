const ITEM_ID_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TICKET_CODE_PATTERN = /^TKT-[A-F0-9]{16}$/;

function validationError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function isPositiveInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function validateGenerationData(data) {
  if (
    !data ||
    !isPositiveInteger(data.orderId) ||
    !isPositiveInteger(data.customerId) ||
    !data.event ||
    !Array.isArray(data.tickets) ||
    data.tickets.length === 0 ||
    data.tickets.length > 100
  ) {
    throw validationError('Datos de compra incompletos o inválidos');
  }

  const { event } = data;
  if (
    !isPositiveInteger(event.id) ||
    typeof event.name !== 'string' ||
    event.name.trim().length === 0 ||
    event.name.length > 200 ||
    typeof event.date !== 'string' ||
    Number.isNaN(new Date(event.date).getTime()) ||
    typeof event.place !== 'string' ||
    event.place.trim().length === 0 ||
    event.place.length > 250
  ) {
    throw validationError('Datos del evento incompletos o inválidos');
  }

  for (const item of data.tickets) {
    if (
      !item ||
      !ITEM_ID_UUID_PATTERN.test(item.itemId || '') ||
      !isPositiveInteger(item.sectorId) ||
      typeof item.sectorName !== 'string' ||
      item.sectorName.trim().length === 0 ||
      item.sectorName.length > 100 ||
      (item.seatNumber != null &&
        (typeof item.seatNumber !== 'string' || item.seatNumber.length > 50))
    ) {
      throw validationError(
        'Cada entrada necesita itemId, sectorId y sectorName válidos'
      );
    }
  }

  const itemIds = data.tickets.map(item => item.itemId);
  if (new Set(itemIds).size !== itemIds.length) {
    throw validationError('Existen itemId duplicados en la compra');
  }
}

function validateOrderLookup(orderId, customerId) {
  if (typeof orderId !== 'string' || !/^[1-9]\d*$/.test(orderId)) {
    throw validationError('Compra no encontrada', 404);
  }

  const numericOrderId = Number(orderId);

  if (!isPositiveInteger(numericOrderId) || !isPositiveInteger(customerId)) {
    throw validationError('Compra no encontrada', 404);
  }

  return numericOrderId;
}

function validateTicketId(ticketId, customerId) {
  const id = Number(ticketId);
  if (!isPositiveInteger(id) || !isPositiveInteger(customerId)) {
    throw validationError('Entrada no encontrada', 404);
  }
  return id;
}

function normalizeTicketCode(code) {
  if (typeof code !== 'string') {
    throw validationError('Código de entrada inválido');
  }

  const normalizedCode = code.trim().toUpperCase();
  if (!TICKET_CODE_PATTERN.test(normalizedCode)) {
    throw validationError('Código de entrada inválido');
  }

  return normalizedCode;
}

module.exports = {
  validateGenerationData,
  validateOrderLookup,
  validateTicketId,
  normalizeTicketCode
};

const ticketsService = require('../services/tickets.service');

async function generate(req, res, next) {
  try {
    if (
      req.user &&
      req.body?.customerId != null &&
      Number(req.body.customerId) !== req.user.id
    ) {
      return res.status(403).json({
        message: 'Solo puedes generar entradas para tu propia cuenta.'
      });
    }

    const tickets = await ticketsService.createTickets(req.body);

    res.status(201).json({
      message: 'Entradas generadas correctamente',
      data: tickets
    });
  } catch (error) {
    next(error);
  }
}

async function myTickets(req, res, next) {
  try {
    const tickets = await ticketsService.getCustomerTickets(
      req.user.id
    );

    res.json({
      data: tickets
    });
  } catch (error) {
    next(error);
  }
}

async function download(req, res, next) {
  try {
    const ticket = await ticketsService.getTicketForDownload(
      req.params.id,
      req.user.id
    );

    res.download(
      ticket.pdfPath,
      `${ticket.code}.pdf`
    );
  } catch (error) {
    next(error);
  }
}

async function getByOrder(req, res, next) {
  try {
    const tickets = await ticketsService.getTicketsByOrder(
      req.params.orderId,
      req.user.id
    );

    res.json({
      data: tickets
    });
  } catch (error) {
    next(error);
  }
}

async function validate(req, res, next) {
  try {
    const result = await ticketsService.validateTicket(
      req.body.code
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function checkIn(req, res, next) {
  try {
    const result = await ticketsService.checkInTicket(
      req.params.code
    );

    res.json({
      message: 'Entrada registrada correctamente',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generate,
  myTickets,
  download,
  getByOrder,
  validate,
  checkIn
};

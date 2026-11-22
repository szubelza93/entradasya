function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
    ? error.status
    : 500;
  let message = error.message;

  if (error.name === 'SequelizeUniqueConstraintError') {
    status = 409;
    message = 'La entrada ya fue generada.';
  } else if (status >= 500) {
    console.error(error);
    message = 'Error interno del servidor';
  }

  res.status(status).json({
    message: message || 'Error interno del servidor'
  });
}

module.exports = errorHandler;

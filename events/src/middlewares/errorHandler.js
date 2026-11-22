function notFound(req, res) {
  res.status(404).json({ message: 'Ruta no encontrada' });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.name === 'MulterError') {
    return res.status(400).json({ message: 'La carga multipart no es válida.' });
  }
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ message: 'Ya existe un elemento con esos datos' });
  }
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ message: 'La referencia indicada no existe o está en uso' });
  }
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({ message: error.errors.map(item => item.message).join(', ') });
  }
  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({ message: status >= 500 ? 'Error interno del servidor' : error.message });
}

module.exports = { notFound, errorHandler };

module.exports = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'La imagen del evento es obligatoria.'
    });
  }

  next();
};

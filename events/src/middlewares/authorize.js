module.exports = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Autenticación requerida.'
    });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      message: 'No tienes permiso para realizar esta operación.'
    });
  }

  next();
};

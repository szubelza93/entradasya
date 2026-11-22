const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Token de autenticación requerido'
    });
  }

  const token = authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });

    const id = Number(decoded.sub || decoded.id);
    const role = decoded.rol || decoded.role;
    if (!Number.isSafeInteger(id) || id <= 0 || typeof role !== 'string') {
      return res.status(401).json({
        message: 'El token no contiene una identidad válida.'
      });
    }

    req.user = {
      id,
      role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Token inválido o expirado'
    });
  }
}

module.exports = authenticate;

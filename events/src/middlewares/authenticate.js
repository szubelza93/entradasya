
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Token de acceso requerido.'
    });
  }

  const token = authorization.split(' ')[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Token inválido o expirado.'
    });
  }
};


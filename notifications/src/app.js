const express = require('express');

const notificationRoutes = require('./routes/notifications.routes');
const { verifyConnection } = require('./services/email.service');

const app = express();

app.use(express.json({ limit: '16kb' }));

async function healthCheck(req, res) {
  try {
    await verifyConnection();
    return res.status(200).json({
      service: 'notifications',
      status: 'ok',
      checks: { smtp: 'ok' },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Notifications health check SMTP failed:', error.message);
    return res.status(503).json({
      service: 'notifications',
      status: 'error',
      checks: { smtp: 'error' },
      timestamp: new Date().toISOString()
    });
  }
}

app.get('/health', healthCheck);
app.get('/api/notifications/health', healthCheck);

app.use('/api/notifications', notificationRoutes);

app.use((err, req, res, next) => {
  console.error('Error en notifications:', err.message);

  const isMulterError = err.name === 'MulterError';
  const status = err.code === 'LIMIT_FILE_SIZE' || err.status === 413
    ? 413
    : isMulterError || [400].includes(err.status)
      ? 400
      : 500;
  const messages = {
    400: 'Los datos o el archivo de la solicitud no son válidos.',
    413: 'El archivo o cuerpo de la solicitud excede el límite permitido.',
    500: 'Error interno al procesar la notificación.'
  };

  res.status(status).json({
    message: messages[status]
  });
});

module.exports = app;
